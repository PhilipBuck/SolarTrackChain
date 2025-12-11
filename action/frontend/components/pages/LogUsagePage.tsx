"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSolarTrack } from "@/hooks/useSolarTrack";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";

export const LogUsagePage = () => {
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

  const [kwh, setKwh] = useState<string>("");
  const [noteCID, setNoteCID] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!kwh || parseFloat(kwh) <= 0) {
      return;
    }

    await solarTrack.logSolarUsage(parseFloat(kwh), noteCID);
    
    if (!solarTrack.message.includes("Error")) {
      setShowSuccess(true);
      setKwh("");
      setNoteCID("");
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-7xl mb-4 animate-bounce">☀️</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-solar-gold to-solar-green bg-clip-text text-transparent mb-4">
              Log Your Solar Usage
            </h1>
            <p className="text-xl text-gray-600">
              Record your daily solar energy contribution with privacy protection
            </p>
          </div>

          {/* Success Animation */}
          {showSuccess && (
            <div className="mb-8 bg-gradient-to-r from-solar-green to-solar-blue text-white rounded-2xl p-8 shadow-2xl animate-pulse">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h3 className="text-3xl font-bold">Success!</h3>
                <p className="text-lg">
                  Your solar usage has been encrypted and logged on-chain!
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                  <span>Energy flowing to the blockchain...</span>
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-solar-gold/30 mb-8">
            {solarTrack.hasLoggedToday ? (
              <div className="text-center space-y-6 py-12">
                <div className="text-8xl">✅</div>
                <h2 className="text-3xl font-bold text-solar-green">
                  Already Logged Today!
                </h2>
                <p className="text-gray-600 text-lg">
                  You&apos;ve already submitted your solar usage for today.
                  <br />
                  Come back tomorrow to continue your contribution!
                </p>
                <div className="pt-4">
                  <Link
                    href="/profile"
                    className="inline-block px-8 py-4 bg-solar-blue text-white rounded-xl font-semibold hover:bg-solar-blue/90 transition-colors shadow-lg"
                  >
                    View My Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="text-4xl mr-3">📊</span>
                  Enter Your Data
                </h2>

                {/* kWh Input */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Solar Energy Generated (kWh) 🔋
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10000"
                      value={kwh}
                      onChange={(e) => setKwh(e.target.value)}
                      className="w-full px-6 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-solar-gold/50 focus:border-solar-gold transition-all"
                      placeholder="0.00"
                      disabled={!fhevmInstance || solarTrack.isLogging}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-semibold">
                      kWh
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    💡 Enter the amount of solar energy you generated or used today
                  </p>
                </div>

                {/* Note CID Input */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    IPFS Note (Optional) 📝
                  </label>
                  <input
                    type="text"
                    value={noteCID}
                    onChange={(e) => setNoteCID(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-solar-gold/50 focus:border-solar-gold transition-all"
                    placeholder="Enter IPFS CID for photos or notes"
                    disabled={solarTrack.isLogging}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    📸 Add photos or notes via IPFS (optional)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    !fhevmInstance ||
                    !kwh ||
                    parseFloat(kwh) <= 0 ||
                    solarTrack.isLogging
                  }
                  className="w-full px-8 py-5 bg-gradient-to-r from-solar-gold to-solar-green text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] relative overflow-hidden group"
                >
                  {solarTrack.isLogging ? (
                    <span className="flex items-center justify-center space-x-3">
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center space-x-3">
                      <span>🔒</span>
                      <span>Submit (Encrypted)</span>
                    </span>
                  )}
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>

                {/* Status Message */}
                {solarTrack.message && (
                  <div className="mt-4 p-4 bg-solar-blue/10 rounded-lg border border-solar-blue/30">
                    <p className="text-sm text-gray-700 text-center">
                      {solarTrack.message}
                    </p>
                  </div>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-solar-gold/10 rounded-xl p-4 border border-solar-gold/30">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="mr-2">🔐</span>
                      Privacy Protected
                    </h4>
                    <p className="text-sm text-gray-600">
                      Your data is encrypted using FHEVM before being stored on-chain
                    </p>
                  </div>
                  <div className="bg-solar-green/10 rounded-xl p-4 border border-solar-green/30">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="mr-2">⛓️</span>
                      Immutable Record
                    </h4>
                    <p className="text-sm text-gray-600">
                      Once submitted, your contribution is permanently recorded
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg p-8 border-2 border-solar-blue/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">ℹ️</span>
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-solar-gold rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Enter Your kWh</h4>
                  <p className="text-gray-600 text-sm">
                    Input the amount of solar energy you generated or used today
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-solar-green rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Automatic Encryption</h4>
                  <p className="text-gray-600 text-sm">
                    Your data is encrypted using FHEVM technology for privacy protection
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-solar-blue rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">On-Chain Storage</h4>
                  <p className="text-gray-600 text-sm">
                    Your encrypted data is stored permanently on the blockchain
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

