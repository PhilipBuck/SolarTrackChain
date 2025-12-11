"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSolarTrack } from "@/hooks/useSolarTrack";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { ConnectWalletPrompt } from "@/components/ConnectWalletPrompt";
import Link from "next/link";
import { useEffect, useState } from "react";

export const Dashboard = () => {
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

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
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
  const [decryptedGlobalTotal, setDecryptedGlobalTotal] = useState<string>("0");

  useEffect(() => {
    if (solarTrack.clearTotalKwh) {
      const value = Number(solarTrack.clearTotalKwh.clear);
      setDecryptedUserTotal(value.toFixed(2));
    }
  }, [solarTrack.clearTotalKwh]);

  useEffect(() => {
    if (solarTrack.clearGlobalTotalKwh) {
      const value = Number(solarTrack.clearGlobalTotalKwh.clear);
      setDecryptedGlobalTotal(value.toFixed(2));
    }
  }, [solarTrack.clearGlobalTotalKwh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-solar-gold/10 via-white to-solar-green/10">
      <Navbar
        isConnected={isConnected}
        account={accounts?.[0]}
        chainId={chainId}
        onConnect={connect}
      />

      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <ConnectWalletPrompt onConnect={connect} />
        ) : (
          <>
            {/* Quick Actions */}
            <div className="mb-8 flex justify-center">
              <Link
                href="/log"
                className="group relative overflow-hidden px-10 py-5 bg-gradient-to-r from-solar-green to-solar-blue text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span className="text-3xl">⚡</span>
                  <span>Log Today&apos;s Solar Usage</span>
                </span>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
            </div>

            {/* Global Stats */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-4xl mr-3">🌍</span>
                Global Impact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  icon="⚡"
                  label="Total kWh Saved"
                  value={decryptedGlobalTotal}
                  color="gold"
                  isLoading={solarTrack.isRefreshing}
                />
                <StatsCard
                  icon="👥"
                  label="Active Contributors"
                  value={solarTrack.totalUsers.toString()}
                  color="green"
                />
                <StatsCard
                  icon="🏆"
                  label="Your Total kWh"
                  value={decryptedUserTotal}
                  color="blue"
                  isLoading={solarTrack.isRefreshing}
                />
              </div>
            </div>

            {/* Today's Status */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-4xl mr-3">📅</span>
                Today&apos;s Status
              </h2>
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-solar-gold/30">
                {solarTrack.hasLoggedToday ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">✅</div>
                    <h3 className="text-2xl font-bold text-solar-green">
                      You&apos;ve logged today!
                    </h3>
                    <p className="text-gray-600">
                      Great job! Come back tomorrow to continue your streak.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-6xl animate-bounce">🌞</div>
                    <h3 className="text-2xl font-bold text-solar-gold">
                      Ready to log today&apos;s solar usage?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Share your contribution to clean energy!
                    </p>
                    <Link
                      href="/log"
                      className="inline-block px-8 py-4 bg-solar-gold text-white rounded-xl font-semibold hover:bg-solar-gold/90 transition-colors shadow-lg"
                    >
                      Log Now
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/profile"
                className="group bg-white rounded-2xl shadow-lg p-8 border-2 border-solar-green/30 hover:border-solar-green transition-all hover:shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-5xl group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      My Profile
                    </h3>
                    <p className="text-gray-600">
                      View your solar journey and achievements
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/leaderboard"
                className="group bg-white rounded-2xl shadow-lg p-8 border-2 border-solar-blue/30 hover:border-solar-blue transition-all hover:shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-5xl group-hover:scale-110 transition-transform">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Leaderboard
                    </h3>
                    <p className="text-gray-600">
                      See top contributors and rankings
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* FHEVM Status */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                FHEVM Status:{" "}
                <span
                  className={`font-semibold ${
                    fhevmStatus === "ready"
                      ? "text-green-500"
                      : fhevmStatus === "error"
                      ? "text-red-500"
                      : "text-yellow-500"
                  }`}
                >
                  {fhevmStatus}
                </span>
              </p>
            </div>
          </>
        )}
      </main>

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-solar-gold/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-solar-green/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
    </div>
  );
};

