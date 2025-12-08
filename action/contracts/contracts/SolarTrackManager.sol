// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SolarTrackManager - Solar energy usage tracking with FHEVM encryption
/// @notice Records encrypted solar energy usage data on-chain with privacy protection
/// @dev Uses FHEVM to encrypt kWh data while maintaining ability to compute totals
contract SolarTrackManager is ZamaEthereumConfig {
    /// @notice Structure to store a solar usage record
    struct Record {
        euint32 encryptedKwh;      // Encrypted kWh value
        uint256 timestamp;          // Block timestamp when recorded
        string noteCID;             // IPFS CID for optional notes/photos
        bool exists;                // Flag to check if record exists
    }

    /// @notice Mapping from user address to day key to record
    /// @dev dayKey = timestamp / 86400 (days since epoch)
    mapping(address => mapping(uint256 => Record)) private _userRecords;

    /// @notice Mapping from user address to total encrypted kWh
    mapping(address => euint32) private _userTotalKwh;

    /// @notice Global total encrypted kWh (sum of all users)
    euint32 private _globalTotalKwh;

    /// @notice List of all users who have ever logged (for leaderboard)
    address[] private _userList;

    /// @notice Total number of unique users
    uint256 private _totalUsers;

    /// @notice Public contribution counter per user (for leaderboard score)
    mapping(address => uint256) private _userLogCount;

    /// @notice Tracks whether a user has ever logged (for unique user count and badges)
    mapping(address => bool) private _hasEverLogged;

    /// @notice Mapping to track if user has already logged today
    mapping(address => mapping(uint256 => bool)) private _hasLoggedToday;

    /// @notice Minimum kWh value to prevent spam (in encrypted form, checked after decryption)
    uint256 public constant MIN_KWH = 0.01 * 1e18; // 0.01 kWh in wei

    /// @notice Maximum kWh per day to prevent abuse
    uint256 public constant MAX_KWH = 10000 * 1e18; // 10000 kWh in wei

    /// @notice Badge types for achievements
    enum Badge {
        FirstStep,      // 0 - First successful log
        Streak3Days,    // 1 - 3-day streak (ending today)
        Kwh100,         // 2 - 100 kWh (not enforced on-chain in this demo)
        Streak30Days    // 3 - 30-day streak (ending today)
    }

    /// @notice Tracks claimed badges per user
    mapping(address => mapping(uint8 => bool)) private _badgeClaimed;

    /// @notice Event emitted when solar usage is logged
    event SolarLogged(
        address indexed user,
        uint256 dayKey,
        uint256 timestamp,
        string noteCID
    );

    /// @notice Event emitted when a new user is registered
    event UserRegistered(address indexed user);

    /// @notice Event emitted when a badge is claimed
    event BadgeClaimed(address indexed user, uint8 badgeId);

    /// @notice Log solar energy usage for the current day
    /// @param encryptedKwh Encrypted kWh value (external format)
    /// @param inputProof Proof for the encrypted input
    /// @param noteCID IPFS CID for optional notes/photos
    /// @dev Each user can only log once per day
    function logSolarUsage(
        externalEuint32 encryptedKwh,
        bytes calldata inputProof,
        string calldata noteCID
    ) external {
        uint256 dayKey = block.timestamp / 86400; // Days since epoch
        
        // Check if user has already logged today
        require(
            !_hasLoggedToday[msg.sender][dayKey],
            "SolarTrackManager: Already logged today"
        );

        // Convert external encrypted value to internal format
        euint32 internalKwh = FHE.fromExternal(encryptedKwh, inputProof);

        // Store the record
        _userRecords[msg.sender][dayKey] = Record({
            encryptedKwh: internalKwh,
            timestamp: block.timestamp,
            noteCID: noteCID,
            exists: true
        });

        // Update user total (encrypted addition)
        _userTotalKwh[msg.sender] = FHE.add(
            _userTotalKwh[msg.sender],
            internalKwh
        );

        // Update global total (encrypted addition)
        _globalTotalKwh = FHE.add(_globalTotalKwh, internalKwh);

        // Mark as logged for today
        _hasLoggedToday[msg.sender][dayKey] = true;

        // Track new users and simple public contribution score
        if (!_hasEverLogged[msg.sender]) {
            _hasEverLogged[msg.sender] = true;
            _totalUsers++;
            _userList.push(msg.sender);
            emit UserRegistered(msg.sender);
        }

        // Increment public log counter (used for leaderboard score)
        _userLogCount[msg.sender] += 1;

        // Grant decryption permissions
        FHE.allowThis(_userTotalKwh[msg.sender]);
        FHE.allow(_userTotalKwh[msg.sender], msg.sender);
        
        FHE.allowThis(_globalTotalKwh);
        FHE.allow(_globalTotalKwh, msg.sender);

        emit SolarLogged(msg.sender, dayKey, block.timestamp, noteCID);
    }

    /// @notice Get user's encrypted record for a specific day
    /// @param user User address
    /// @param dayKey Day key (timestamp / 86400)
    /// @return encryptedKwh Encrypted kWh value
    /// @return timestamp Block timestamp
    /// @return noteCID IPFS CID
    /// @return exists Whether the record exists
    function getUserRecord(
        address user,
        uint256 dayKey
    ) external view returns (
        euint32 encryptedKwh,
        uint256 timestamp,
        string memory noteCID,
        bool exists
    ) {
        Record memory record = _userRecords[user][dayKey];
        return (
            record.encryptedKwh,
            record.timestamp,
            record.noteCID,
            record.exists
        );
    }

    /// @notice Get user's total encrypted kWh
    /// @param user User address
    /// @return Encrypted total kWh for the user
    function getUserTotalKwh(address user) external view returns (euint32) {
        return _userTotalKwh[user];
    }

    /// @notice Get global total encrypted kWh
    /// @return Encrypted total kWh across all users
    function getGlobalTotalKwh() external view returns (euint32) {
        return _globalTotalKwh;
    }

    /// @notice Get total number of unique users
    /// @return Total number of users who have logged at least once
    function getTotalUsers() external view returns (uint256) {
        return _totalUsers;
    }

    /// @notice Check if user has logged today
    /// @param user User address
    /// @return Whether the user has logged today
    function hasLoggedToday(address user) external view returns (bool) {
        uint256 dayKey = block.timestamp / 86400;
        return _hasLoggedToday[user][dayKey];
    }

    /// @notice Get user's encrypted record for today
    /// @param user User address
    /// @return encryptedKwh Encrypted kWh value
    /// @return timestamp Block timestamp
    /// @return noteCID IPFS CID
    /// @return exists Whether the record exists
    function getTodayRecord(
        address user
    ) external view returns (
        euint32 encryptedKwh,
        uint256 timestamp,
        string memory noteCID,
        bool exists
    ) {
        uint256 dayKey = block.timestamp / 86400;
        Record memory record = _userRecords[user][dayKey];
        return (
            record.encryptedKwh,
            record.timestamp,
            record.noteCID,
            record.exists
        );
    }

    /// @notice Get user's total encrypted kWh (for score calculation)
    /// @dev Frontend will decrypt this and multiply by 10, then add consecutive days bonus
    /// @param user User address
    /// @return Encrypted total kWh for the user
    /// @dev This is the same as getUserTotalKwh, kept for backward compatibility
    function getUserBaseScore(
        address user
    ) external view returns (euint32) {
        // Return total kWh, frontend will handle multiplication and bonus calculation
        return _userTotalKwh[user];
    }

    /// @notice Get public log count for a user (used as leaderboard score)
    /// @param user User address
    /// @return Number of times the user has logged usage
    function getUserLogCount(address user) external view returns (uint256) {
        return _userLogCount[user];
    }

    /// @notice Get list of all users who have ever logged (for off-chain leaderboard)
    /// @return Array of user addresses
    function getAllUsers() external view returns (address[] memory) {
        return _userList;
    }

    /// @notice Check if a user has already claimed a badge
    /// @param user User address
    /// @param badgeId Numeric badge ID (see Badge enum)
    function hasBadge(address user, uint8 badgeId) external view returns (bool) {
        return _badgeClaimed[user][badgeId];
    }

    /// @notice Internal helper to check for a consecutive-day streak ending today
    /// @param user User address
    /// @param streakDays Number of consecutive days required
    function _hasStreak(address user, uint256 streakDays) internal view returns (bool) {
        if (streakDays == 0) {
            return false;
        }

        uint256 todayDayKey = block.timestamp / 86400;
        uint256 currentStreak = 0;

        // Require the streak to end today; break on first missing day
        for (uint256 i = 0; i < streakDays; i++) {
            uint256 dayKey = todayDayKey - i;
            if (_userRecords[user][dayKey].exists) {
                currentStreak++;
                if (currentStreak == streakDays) {
                    return true;
                }
            } else {
                break;
            }
        }

        return false;
    }

    /// @notice Claim an achievement badge
    /// @param badgeId The numeric ID of the badge (see Badge enum)
    /// @dev This demo implements on-chain checks for:
    /// - FirstStep: user has ever logged
    /// - Streak3Days: user logged for the last 3 consecutive days
    /// - Streak30Days: user logged for the last 30 consecutive days
    /// The 100 kWh badge is not enforced on-chain because the total is encrypted.
    function claimBadge(uint8 badgeId) external {
        require(!_badgeClaimed[msg.sender][badgeId], "SolarTrackManager: badge already claimed");

        if (badgeId == uint8(Badge.FirstStep)) {
            require(_hasEverLogged[msg.sender], "SolarTrackManager: no usage recorded");
        } else if (badgeId == uint8(Badge.Streak3Days)) {
            require(_hasStreak(msg.sender, 3), "SolarTrackManager: no 3-day streak");
        } else if (badgeId == uint8(Badge.Streak30Days)) {
            require(_hasStreak(msg.sender, 30), "SolarTrackManager: no 30-day streak");
        } else if (badgeId == uint8(Badge.Kwh100)) {
            revert("SolarTrackManager: 100kWh badge not enforced on-chain");
        } else {
            revert("SolarTrackManager: invalid badgeId");
        }

        _badgeClaimed[msg.sender][badgeId] = true;
        emit BadgeClaimed(msg.sender, badgeId);
    }
}

