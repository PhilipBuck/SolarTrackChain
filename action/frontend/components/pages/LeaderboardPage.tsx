"use client";

import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSolarTrack } from "@/hooks/useSolarTrack";
import { Navbar } from "@/components/Navbar";
import { SolarTrackManagerABI } from "@/abi/SolarTrackManagerABI";
import { useEffect, useMemo, useState } from "react";

type LeaderboardEntry = {
  address: string;
  logCount: number;
  rank: number;
  isCurrentUser: boolean;
};

export const LeaderboardPage = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const solarTrack = useSolarTrack({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [decryptedUserTotal, setDecryptedUserTotal] = useState<string>("0");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (solarTrack.clearTotalKwh) {
      const clearValue = solarTrack.clearTotalKwh.clear;
      // Handle both bigint and number/string
      const numValue = typeof clearValue === "bigint" 
        ? Number(clearValue) 
        : Number(clearValue);
      
      console.log("LeaderboardPage: clearTotalKwh updated", {
        clear: clearValue,
        numValue,
        formatted: numValue.toFixed(2),
      });
      
      setDecryptedUserTotal(numValue.toFixed(2));
    } else {
      // Reset to "0" if clearTotalKwh is cleared
      setDecryptedUserTotal("0");
    }
  }, [solarTrack.clearTotalKwh]);

  // Load real leaderboard data from contract
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!ethersReadonlyProvider || !solarTrack.contractAddress) {
        setEntries([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const contract = new ethers.Contract(
          solarTrack.contractAddress,
          SolarTrackManagerABI.abi,
          ethersReadonlyProvider
        );

        const users: string[] = await contract.getAllUsers();
        if (!users || users.length === 0) {
          setEntries([]);
          return;
        }

        // Fetch public log count for each user (used as ranking score)
        const counts: bigint[] = await Promise.all(
          users.map((u: string) => contract.getUserLogCount(u))
        );

        const current = accounts?.[0]?.toLowerCase();

        const unsorted: LeaderboardEntry[] = users.map((u, idx) => ({
          address: u,
          logCount: Number(counts[idx] ?? BigInt(0)),
          rank: 0,
          isCurrentUser: current ? u.toLowerCase() === current : false,
        }));

        // Sort by logCount descending, then address for stability
        unsorted.sort((a, b) => {
          if (b.logCount !== a.logCount) return b.logCount - a.logCount;
          return a.address.localeCompare(b.address);
        });

        const limited = unsorted.slice(0, 100).map((e, i) => ({
          ...e,
          rank: i + 1,
        }));

        setEntries(limited);
      } catch (e: any) {
        console.error("Failed to load leaderboard:", e);
        setError(e?.message || "无法加载排行榜数据");
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [ethersReadonlyProvider, solarTrack.contractAddress, accounts]);

  const userScore = useMemo(
    () => (decryptedUserTotal ? (Number(decryptedUserTotal) * 10).toFixed(0) : "0"),
    [decryptedUserTotal]
  );

  const handleDecrypt = async () => {
    await solarTrack.decryptUserTotalKwh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-solar-gold/10 via-white to-solar-green/10">
      <Navbar
        isConnected={isConnected}
        account={accounts?.[0]}
        chainId={chainId}
        onConnect={connect}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-7xl mb-4">🏆</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-solar-gold to-solar-green bg-clip-text text-transparent mb-4">
              Global Leaderboard
            </h1>
            <p className="text-xl text-gray-600">
              Top solar energy contributors making a difference
            </p>
          </div>

          {/* Total Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-solar-gold/30 text-center">
              <div className="text-4xl mb-3">🌍</div>
              <p className="text-3xl font-bold text-solar-gold">
                {solarTrack.totalUsers.toString()}
              </p>
              <p className="text-gray-600 font-medium">Total Contributors</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-solar-green/30 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-3xl font-bold text-solar-green">
                {solarTrack.clearGlobalTotalKwh 
                  ? Number(solarTrack.clearGlobalTotalKwh.clear).toFixed(2) 
                  : "***"} kWh
              </p>
              <p className="text-gray-600 font-medium">Global Total Energy</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-solar-blue/30 text-center">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-3xl font-bold text-solar-blue">
                {solarTrack.clearGlobalTotalKwh 
                  ? (Number(solarTrack.clearGlobalTotalKwh.clear) * 0.5).toFixed(2)
                  : "***"} kg
              </p>
              <p className="text-gray-600 font-medium">CO₂ Saved</p>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-solar-gold/30">
            <div className="bg-gradient-to-r from-solar-gold to-solar-green p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <span className="mr-3">👑</span>
                  Top 100 Contributors
                </h2>
                {isConnected && (
                  <button
                    onClick={handleDecrypt}
                    disabled={solarTrack.isDecrypting}
                    className="px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {solarTrack.isDecrypting ? "解密中..." : "解密我的排行榜数据"}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 text-sm text-red-500 text-center">{error}</div>
              )}
              {solarTrack.message && (
                <div className="mb-4 text-sm text-center text-gray-600 bg-blue-50 rounded-lg p-2">
                  {solarTrack.message}
                </div>
              )}
              <div className="space-y-3">
                {isLoading && entries.length === 0 && (
                  <div className="text-center text-gray-500 py-6 text-sm">
                    Loading leaderboard...
                  </div>
                )}
                {!isLoading &&
                  entries.map((user, index) => {
                    const isTop3 = index < 3;
                    const shortAddress =
                      user.address.slice(0, 8) + "..." + user.address.slice(-4);

                    // 只对当前用户显示解密后的 kWh 和积分；其他人保持隐私
                    // 只要 clearTotalKwh 存在（已解密），就显示真实值，即使为 0
                    const showReal =
                      user.isCurrentUser && 
                      solarTrack.clearTotalKwh !== undefined;

                    const displayKwh = showReal ? decryptedUserTotal : "***";
                    const displayScore = showReal ? userScore : "***";

                    const badgeIcon = isTop3
                      ? index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : "🥉"
                      : "🏅";

                    return (
                      <div
                        key={user.address}
                        className={`flex items-center space-x-6 p-6 rounded-xl transition-all hover:shadow-lg ${
                          isTop3
                            ? "bg-gradient-to-r from-solar-gold/10 to-solar-green/10 border-2 border-solar-gold/30"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex-shrink-0 text-4xl">{badgeIcon}</div>
                        <div className="flex-shrink-0 w-12 text-center">
                          <span className="text-2xl font-bold text-gray-700">
                            #{user.rank}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-mono font-semibold text-gray-800">
                            {shortAddress}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-2xl font-bold text-solar-gold">
                            {displayKwh} kWh
                          </p>
                          <p className="text-sm text-gray-500">
                            Score: {displayScore}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Your Rank */}
              {isConnected && (
                <div className="mt-8 p-6 bg-gradient-to-r from-solar-blue/20 to-solar-green/20 rounded-xl border-2 border-solar-blue/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">✨</div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                        <p className="font-mono font-semibold text-gray-800">
                          {accounts?.[0]?.slice(0, 10)}...{accounts?.[0]?.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-solar-blue">
                        {decryptedUserTotal} kWh
                      </p>
                      <p className="text-sm text-gray-600">
                        Score: {userScore}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-solar-gold/10 rounded-2xl p-6 border-2 border-solar-gold/30">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">ℹ️</div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Privacy Note</h4>
                <p className="text-gray-600 text-sm">
                  All data is encrypted using FHEVM technology. Only you can decrypt and view your personal solar energy usage data.
                  The leaderboard displays decrypted data that users have chosen to share.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

