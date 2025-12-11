"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { SolarTrackManagerAddresses } from "@/abi/SolarTrackManagerAddresses";
import { SolarTrackManagerABI } from "@/abi/SolarTrackManagerABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type SolarTrackInfoType = {
  abi: typeof SolarTrackManagerABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getSolarTrackByChainId(
  chainId: number | undefined
): SolarTrackInfoType {
  if (!chainId) {
    return { abi: SolarTrackManagerABI.abi };
  }

  const entry =
    SolarTrackManagerAddresses[chainId.toString() as keyof typeof SolarTrackManagerAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: SolarTrackManagerABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: SolarTrackManagerABI.abi,
  };
}

export const useSolarTrack = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [totalKwhHandle, setTotalKwhHandle] = useState<string | undefined>(undefined);
  const [clearTotalKwh, setClearTotalKwh] = useState<ClearValueType | undefined>(undefined);
  const [globalTotalKwhHandle, setGlobalTotalKwhHandle] = useState<string | undefined>(undefined);
  const [clearGlobalTotalKwh, setClearGlobalTotalKwh] = useState<ClearValueType | undefined>(undefined);
  const [totalUsers, setTotalUsers] = useState<bigint>(BigInt(0));
  const [hasLoggedToday, setHasLoggedToday] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isLoggingRef = useRef<boolean>(isLogging);
  const solarTrackRef = useRef<SolarTrackInfoType | undefined>(undefined);

  const solarTrack = useMemo(() => {
    const c = getSolarTrackByChainId(chainId);
    solarTrackRef.current = c;
    return c;
  }, [chainId]);

  // Track if we've set a deployment error message
  const deploymentErrorRef = useRef<string | null>(null);

  // Update message based on contract deployment status
  useEffect(() => {
    // Only update deployment-related messages, don't interfere with operation messages
    if (!solarTrack.address) {
      // Provide helpful error messages based on the situation
      let errorMsg: string;
      if (chainId === undefined) {
        errorMsg = "请先连接钱包以获取网络信息。";
      } else {
        errorMsg = `未找到 chainId=${chainId} 的 SolarTrackManager 部署。`;
      }
      
      // Only set if it's different from what we last set
      if (deploymentErrorRef.current !== errorMsg) {
        setMessage(errorMsg);
        deploymentErrorRef.current = errorMsg;
      }
    } else {
      // Clear deployment error message when contract is found and no operation is running
      if (deploymentErrorRef.current && !isLogging && !isRefreshing && !isDecrypting) {
        setMessage("");
        deploymentErrorRef.current = null;
      }
    }
  }, [solarTrack.address, chainId, isLogging, isRefreshing, isDecrypting]);

  const isDeployed = useMemo(() => {
    if (!solarTrack) {
      return undefined;
    }
    return Boolean(solarTrack.address);
  }, [solarTrack]);

  const contractAddress = useMemo(() => {
    return solarTrack?.address;
  }, [solarTrack]);

  // Refresh total users
  const refreshTotalUsers = useCallback(async () => {
    if (!ethersReadonlyProvider || !contractAddress) {
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        solarTrack.abi,
        ethersReadonlyProvider
      );
      const users = await contract.getTotalUsers();
      setTotalUsers(users);
    } catch (error) {
      console.error("Error fetching total users:", error);
    }
  }, [ethersReadonlyProvider, contractAddress, solarTrack.abi]);

  // Refresh has logged today
  const refreshHasLoggedToday = useCallback(async () => {
    if (!ethersReadonlyProvider || !contractAddress || !ethersSigner) {
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        solarTrack.abi,
        ethersReadonlyProvider
      );
      const address = await ethersSigner.getAddress();
      const hasLogged = await contract.hasLoggedToday(address);
      setHasLoggedToday(hasLogged);
    } catch (error) {
      console.error("Error checking hasLoggedToday:", error);
    }
  }, [ethersReadonlyProvider, contractAddress, ethersSigner, solarTrack.abi]);

  // Refresh user total kWh handle
  const refreshUserTotalKwh = useCallback(async () => {
    if (!ethersReadonlyProvider || !contractAddress || !ethersSigner) {
      return;
    }

    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setMessage("Loading user total kWh...");

    try {
      const contract = new ethers.Contract(
        contractAddress,
        solarTrack.abi,
        ethersReadonlyProvider
      );
      const address = await ethersSigner.getAddress();
      const handle = await contract.getUserTotalKwh(address);
      setTotalKwhHandle(handle.toString());
      setMessage("User total kWh handle loaded");
    } catch (error) {
      console.error("Error fetching user total kWh:", error);
      setMessage("Error loading user total kWh");
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [ethersReadonlyProvider, contractAddress, ethersSigner, solarTrack.abi]);

  // Refresh global total kWh handle
  const refreshGlobalTotalKwh = useCallback(async () => {
    if (!ethersReadonlyProvider || !contractAddress) {
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        solarTrack.abi,
        ethersReadonlyProvider
      );
      const handle = await contract.getGlobalTotalKwh();
      setGlobalTotalKwhHandle(handle.toString());
      setMessage("Global total kWh handle loaded");
    } catch (error) {
      console.error("Error fetching global total kWh:", error);
    }
  }, [ethersReadonlyProvider, contractAddress, solarTrack.abi]);

  // Decrypt user total kWh
  const decryptUserTotalKwh = useCallback(async () => {
    if (
      !instance ||
      !totalKwhHandle ||
      !contractAddress ||
      !ethersSigner ||
      isDecryptingRef.current
    ) {
      return;
    }

    // If the handle is ZeroHash, it means no encrypted value has been written yet.
    // In that case there is nothing to decrypt and calling userDecrypt will fail
    // with an authorization error on handle 0x00...00.
    if (
      totalKwhHandle === ethers.ZeroHash ||
      totalKwhHandle === "0x0" ||
      /^0x0+$/.test(totalKwhHandle)
    ) {
      setClearTotalKwh({ handle: totalKwhHandle, clear: BigInt(0) });
      setMessage("You don't have any logged solar usage to decrypt yet.");
      return;
    }

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Decrypting user total kWh...");

    try {
      const sig: FhevmDecryptionSignature | null =
        await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      const res = await instance.userDecrypt(
        [{ handle: totalKwhHandle, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const decryptedValue = res[totalKwhHandle];
      console.log("Decryption result:", {
        handle: totalKwhHandle,
        decryptedValue,
        type: typeof decryptedValue,
        valueString: String(decryptedValue),
      });

      // Convert to BigInt if needed
      const clearValue = typeof decryptedValue === "bigint" 
        ? decryptedValue 
        : BigInt(Number(decryptedValue));

      setClearTotalKwh({ handle: totalKwhHandle, clear: clearValue });
      setMessage(`解密成功！总 kWh: ${clearValue.toString()}`);
    } catch (error) {
      console.error("Error decrypting:", error);
      setMessage("Error decrypting user total kWh");
    } finally {
      isDecryptingRef.current = false;
      setIsDecrypting(false);
    }
  }, [
    instance,
    totalKwhHandle,
    contractAddress,
    ethersSigner,
    fhevmDecryptionSignatureStorage,
  ]);

  // Log solar usage
  const logSolarUsage = useCallback(
    async (kwh: number, noteCID: string) => {
      if (
        !instance ||
        !contractAddress ||
        !ethersSigner ||
        isLoggingRef.current
      ) {
        return;
      }

      isLoggingRef.current = true;
      setIsLogging(true);
      setMessage("Encrypting kWh value...");

      try {
        // Convert kWh to uint32 (max value for euint32)
        // Note: euint32 can hold values up to 2^32 - 1
        // For kWh, we'll use the value directly (assuming reasonable kWh values)
        const kwhValue = Math.floor(kwh);
        if (kwhValue < 0 || kwhValue > 4294967295) {
          throw new Error("kWh value must be between 0 and 4294967295");
        }

        // Let browser repaint before CPU-intensive encryption
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create encrypted input using FHEVM API
        const userAddress = await ethersSigner.getAddress();
        const input = instance.createEncryptedInput(
          contractAddress,
          userAddress
        );
        input.add32(kwhValue);

        // Encrypt (CPU-intensive operation)
        const enc = await input.encrypt();

        // Debug: Log encryption result
        console.log("=== Encryption Result ===");
        console.log("enc.handles:", enc.handles);
        console.log("enc.handles type:", typeof enc.handles);
        console.log("enc.handles[0]:", enc.handles?.[0]);
        console.log("enc.handles[0] type:", typeof enc.handles?.[0]);
        console.log("enc.inputProof type:", typeof enc.inputProof);
        console.log("enc.inputProof:", 
          typeof enc.inputProof === "string" 
            ? `${enc.inputProof.slice(0, 100)}... (length: ${enc.inputProof.length})` 
            : enc.inputProof
        );
        console.log("========================");

        if (!enc.handles || enc.handles.length === 0) {
          throw new Error("Encryption failed: No handles generated");
        }

        if (!enc.inputProof) {
          throw new Error("Encryption failed: No input proof generated");
        }

        setMessage("Submitting to blockchain...");

        // Convert Uint8Array to hex string format for contract call
        let handle = enc.handles[0];
        let proof = enc.inputProof;

        // Validate handle format
        if (!handle) {
          throw new Error("Encryption failed: Handle is empty");
        }

        // Validate proof format
        if (!proof) {
          throw new Error("Encryption failed: Input proof is empty");
        }

        // Convert Uint8Array to hex string if needed
        if (handle instanceof Uint8Array) {
          handle = ethers.hexlify(handle);
          console.log("Converted handle to hex:", handle);
        }

        if (proof instanceof Uint8Array) {
          proof = ethers.hexlify(proof);
          console.log("Converted proof to hex:", proof.slice(0, 66) + "...");
        }

        // Log for debugging (truncated to avoid console spam)
        console.log("Calling contract with:", {
          contractAddress,
          handleType: typeof handle,
          handleLength: typeof handle === "string" ? handle.length : "non-string",
          proofType: typeof proof,
          proofLength: typeof proof === "string" ? proof.length : "non-string",
          noteCID: noteCID || "",
        });

        // Create contract instance with proper ABI
        const contract = new ethers.Contract(
          contractAddress,
          solarTrack.abi,
          ethersSigner
        );

        // Verify the function exists in the ABI
        const logSolarUsageFunction = contract.interface.getFunction("logSolarUsage");
        if (!logSolarUsageFunction) {
          throw new Error("logSolarUsage function not found in ABI");
        }

        console.log("Function signature:", logSolarUsageFunction.format());

        // Check if contract is deployed by checking code size
        if (ethersReadonlyProvider) {
          const code = await ethersReadonlyProvider.getCode(contractAddress);
          if (!code || code === "0x") {
            throw new Error(`合约未部署在地址 ${contractAddress}。请先部署合约。`);
          }
          
          // Verify contract is accessible by calling a simple view function
          try {
            await contract.getTotalUsers();
            console.log("Contract connectivity verified");
          } catch (verifyError: any) {
            console.warn("Contract connectivity check failed:", verifyError);
            // Don't throw here, as it might be a temporary issue
          }
          
          // Check if user has already logged today
          try {
            const hasLogged = await contract.hasLoggedToday(userAddress);
            if (hasLogged) {
              throw new Error("您今天已经提交过太阳能使用记录了。每天只能提交一次。");
            }
            console.log("Pre-check passed: User has not logged today");
          } catch (checkError: any) {
            if (checkError.message && checkError.message.includes("已经提交过")) {
              throw checkError;
            }
            console.warn("Pre-check warning:", checkError);
            // Continue even if check fails
          }
        }

        // Directly call the contract (FHEVM encrypted calls may not support staticCall)
        // This matches the pattern used in working examples
        setMessage("提交交易到区块链...");
        
        // Log detailed information about the call parameters
        console.log("=== Transaction Parameters ===");
        console.log("Contract address:", contractAddress);
        console.log("Handle:", handle);
        console.log("Handle type:", typeof handle);
        console.log("Handle is string:", typeof handle === "string");
        console.log("Proof:", typeof proof === "string" ? `${proof.slice(0, 100)}...` : proof);
        console.log("Proof type:", typeof proof);
        console.log("Proof length:", typeof proof === "string" ? proof.length : "N/A");
        console.log("NoteCID:", noteCID || "");
        console.log("============================");
        
        // Try to manually estimate gas first to get better error messages
        try {
          console.log("Attempting gas estimation...");
          const gasEstimate = await contract.logSolarUsage.estimateGas(
            handle,
            proof,
            noteCID || ""
          );
          console.log("Gas estimate successful:", gasEstimate.toString());
        } catch (gasError: any) {
          console.error("Gas estimation failed:", {
            code: gasError?.code,
            reason: gasError?.reason,
            shortMessage: gasError?.shortMessage,
            message: gasError?.message,
            data: gasError?.data,
          });
          
          // Try to extract more information
          if (gasError?.data) {
            try {
              const errorFragment = contract.interface.parseError(gasError.data);
              if (errorFragment) {
                throw new Error(`合约要求检查失败: ${errorFragment.name}`);
              }
            } catch {}
          }
          
          // Provide specific error message
          throw new Error(
            "Gas估算失败。可能的原因:\n" +
            "1. 您今天已经提交过记录\n" +
            "2. 加密数据格式不正确\n" +
            "3. 合约调用参数错误\n" +
            "4. 网络或节点问题\n\n" +
            `详细信息: ${gasError?.shortMessage || gasError?.message || "未知错误"}`
          );
        }
        
        let tx: ethers.ContractTransactionResponse;
        try {
          tx = await contract.logSolarUsage(
            handle,
            proof,
            noteCID || ""
          );
          console.log("Transaction submitted:", tx.hash);
        } catch (txError: any) {
          // Handle transaction submission errors with detailed information
          let errorMessage = "交易提交失败";
          
          console.error("Transaction submission error:", {
            code: txError?.code,
            reason: txError?.reason,
            shortMessage: txError?.shortMessage,
            message: txError?.message,
            data: txError?.data,
          });
          
          // Try to extract meaningful error message
          if (txError?.reason) {
            errorMessage = txError.reason;
          } else if (txError?.shortMessage) {
            errorMessage = txError.shortMessage;
          } else if (txError?.data && txError.data !== "0x" && txError.data !== null) {
            // Try to parse error data
            try {
              const errorFragment = contract.interface.parseError(txError.data);
              if (errorFragment) {
                errorMessage = `${errorFragment.name}: ${JSON.stringify(errorFragment.args)}`;
              } else {
                // Try to decode as string revert
                try {
                  if (txError.data.length >= 138 && txError.data.startsWith("0x08c379a0")) {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                      ["string"],
                      "0x" + txError.data.slice(138)
                    );
                    errorMessage = decoded[0];
                  } else {
                    errorMessage = `合约调用失败: ${txError.data.slice(0, 20)}...`;
                  }
                } catch {
                  errorMessage = `合约调用失败 (数据: ${txError.data.slice(0, 20)}...)`;
                }
              }
            } catch (parseError) {
              errorMessage = txError?.message || "交易提交失败，请检查网络连接和合约状态";
            }
          } else if (txError?.message) {
            errorMessage = txError.message;
          } else if (txError?.code === "CALL_EXCEPTION") {
            errorMessage = "合约调用异常。可能的原因：\n" +
              "1. 合约未正确部署\n" +
              "2. 加密数据格式错误\n" +
              "3. 网络连接问题\n" +
              "4. 您今天已经提交过记录";
          } else {
            errorMessage = "交易提交失败，请检查控制台获取详细信息";
          }
          
          throw new Error(errorMessage);
        }

        setMessage("等待交易确认...");
        
        let receipt: ethers.ContractTransactionReceipt | null;
        try {
          receipt = await tx.wait();
        } catch (waitError: any) {
          console.error("Transaction wait error:", waitError);
          let errorMessage = "交易确认失败";
          
          if (waitError?.reason) {
            errorMessage = waitError.reason;
          } else if (waitError?.shortMessage) {
            errorMessage = waitError.shortMessage;
          } else if (waitError?.message) {
            errorMessage = waitError.message;
          }
          
          throw new Error(errorMessage);
        }
        
        if (!receipt || receipt.status !== 1) {
          throw new Error(`交易失败，状态: ${receipt?.status || "未知"}`);
        }

        setMessage("太阳能使用记录提交成功! 🌞⚡");

        // Refresh data
        await Promise.all([
          refreshUserTotalKwh(),
          refreshGlobalTotalKwh(),
          refreshTotalUsers(),
          refreshHasLoggedToday(),
        ]);
      } catch (error: any) {
        console.error("Error logging solar usage:", error);
        
        // Provide more detailed error messages
        let errorMessage = "提交太阳能使用记录失败";
        
        // Use the error message if it's already in Chinese or is a detailed message
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.reason) {
          errorMessage = error.reason;
        } else if (error?.shortMessage) {
          errorMessage = error.shortMessage;
        } else if (error?.code === "CALL_EXCEPTION") {
          errorMessage = "合约调用失败。可能的原因：\n" +
            "- 合约未在指定地址部署\n" +
            "- 加密数据格式无效\n" +
            "- 网络连接问题\n" +
            "- Gas 不足\n" +
            "- 交易会回退（请检查合约要求，例如：今天是否已提交过）";
        } else if (error?.code) {
          errorMessage = `交易失败，错误代码: ${error.code}`;
        }
        
        setMessage(errorMessage);
      } finally {
        isLoggingRef.current = false;
        setIsLogging(false);
      }
    },
    [
      instance,
      contractAddress,
      ethersSigner,
      solarTrack.abi,
      refreshUserTotalKwh,
      refreshGlobalTotalKwh,
      refreshTotalUsers,
      refreshHasLoggedToday,
    ]
  );

  // Auto refresh on mount
  useEffect(() => {
    if (ethersReadonlyProvider && contractAddress) {
      refreshTotalUsers();
      refreshHasLoggedToday();
      refreshUserTotalKwh();
      refreshGlobalTotalKwh();
    }
  }, [
    ethersReadonlyProvider,
    contractAddress,
    refreshTotalUsers,
    refreshHasLoggedToday,
    refreshUserTotalKwh,
    refreshGlobalTotalKwh,
  ]);

  return {
    contractAddress,
    isDeployed,
    totalKwhHandle,
    clearTotalKwh,
    globalTotalKwhHandle,
    clearGlobalTotalKwh,
    totalUsers,
    hasLoggedToday,
    isLogging,
    isRefreshing,
    isDecrypting,
    message,
    logSolarUsage,
    decryptUserTotalKwh,
    refreshUserTotalKwh,
    refreshGlobalTotalKwh,
    refreshTotalUsers,
    refreshHasLoggedToday,
  };
};

