"use client";

import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSolarTrack } from "@/hooks/useSolarTrack";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { SolarTrackManagerABI } from "@/abi/SolarTrackManagerABI";
import { useEffect, useMemo, useState } from "react";

type CalendarDay = {
  date: Date;
  hasRecord: boolean;
  isToday: boolean;
};

type BadgeId = "first_step" | "streak_3" | "kwh_100" | "streak_30";

type BadgeConfig = {
  id: BadgeId;
  icon: string;
  name: string;
  description: string;
};

export const ProfilePage = () => {
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
  const [userScore, setUserScore] = useState<string>("0");
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [claimedBadges, setClaimedBadges] = useState<Record<BadgeId, boolean>>({
    first_step: false,
    streak_3: false,
    kwh_100: false,
    streak_30: false,
  });

  useEffect(() => {
    if (solarTrack.clearTotalKwh) {
      const value = Number(solarTrack.clearTotalKwh.clear);
      setDecryptedUserTotal(value.toFixed(2));
      setUserScore((value * 10).toFixed(0));
    }
  }, [solarTrack.clearTotalKwh]);

  // Load claimed badges from localStorage
  useEffect(() => {
    const loadBadges = async () => {
      if (
        !accounts ||
        accounts.length === 0 ||
        !ethersReadonlyProvider ||
        !solarTrack.contractAddress
      ) {
        return;
      }

      try {
        const contract = new ethers.Contract(
          solarTrack.contractAddress,
          SolarTrackManagerABI.abi,
          ethersReadonlyProvider
        );

        const user = accounts[0];
        const firstStep = await contract.hasBadge(user, 0); // Badge.FirstStep

        setClaimedBadges((prev) => ({
          ...prev,
          first_step: firstStep,
        }));
      } catch (e) {
        console.error("Failed to load badges from contract:", e);
      }
    };

    loadBadges();
  }, [accounts, ethersReadonlyProvider, solarTrack.contractAddress]);

  // Build real activity calendar from on-chain records (last 35 days)
  useEffect(() => {
    const loadCalendar = async () => {
      if (
        !ethersReadonlyProvider ||
        !solarTrack.contractAddress ||
        !accounts ||
        accounts.length === 0
      ) {
        setCalendarDays([]);
        return;
      }

      try {
        setIsCalendarLoading(true);
        setCalendarError(null);

        const contract = new ethers.Contract(
          solarTrack.contractAddress,
          SolarTrackManagerABI.abi,
          ethersReadonlyProvider
        );

        const userAddress = accounts[0];

        // Use current time to derive today's dayKey (same formula as contract)
        const nowSeconds = Math.floor(Date.now() / 1000);
        const todayDayKey = Math.floor(nowSeconds / 86400);

        const days: CalendarDay[] = [];

        // Build last 35 days from oldest -> newest
        for (let offset = 34; offset >= 0; offset--) {
          const dayKey = todayDayKey - offset;
          const tsMs = dayKey * 86400 * 1000;
          const date = new Date(tsMs);

          let hasRecord = false;
          try {
            const record = await contract.getUserRecord(userAddress, dayKey);
            // record[3] is "exists" bool
            if (record && record[3]) {
              hasRecord = Boolean(record[3]);
            }
          } catch (e) {
            // Swallow errors for individual days; keep calendar robust
            // console.warn("getUserRecord failed for dayKey", dayKey, e);
          }

          days.push({
            date,
            hasRecord,
            isToday: dayKey === todayDayKey,
          });
        }

        setCalendarDays(days);
      } catch (e: any) {
        console.error("Failed to load activity calendar:", e);
        setCalendarError(e?.message || "无法加载活动日历");
      } finally {
        setIsCalendarLoading(false);
      }
    };

    loadCalendar();
  }, [ethersReadonlyProvider, solarTrack.contractAddress, accounts]);

  // Compute longest streak from calendar
  const maxStreak = useMemo(() => {
    if (!calendarDays.length) return 0;
    const sorted = [...calendarDays].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    let best = 0;
    let cur = 0;
    for (const d of sorted) {
      if (d.hasRecord) {
        cur += 1;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }
    return best;
  }, [calendarDays]);

  const totalKwhNumber = useMemo(
    () => Number.isFinite(Number(decryptedUserTotal)) ? Number(decryptedUserTotal) : 0,
    [decryptedUserTotal]
  );

  const hasAnyRecord = useMemo(
    () => calendarDays.some((d) => d.hasRecord),
    [calendarDays]
  );

  const badgeConfigs: BadgeConfig[] = [
    {
      id: "first_step",
      icon: "🌱",
      name: "第一步",
      description: "首次成功记录太阳能使用",
    },
  ];

  const canClaimBadge = (id: BadgeId): boolean => {
    if (claimedBadges[id]) return false;
    switch (id) {
      case "first_step":
        return hasAnyRecord;
      default:
        return false;
    }
  };

  const claimBadge = async (id: BadgeId) => {
    if (!canClaimBadge(id)) return;
    if (!ethersSigner || !solarTrack.contractAddress) return;

    try {
      // Only first_step is on-chain for now (Badge.FirstStep = 0)
      if (id !== "first_step") return;

      const contract = new ethers.Contract(
        solarTrack.contractAddress,
        SolarTrackManagerABI.abi,
        ethersSigner
      );

      const tx = await contract.claimBadge(0);
      await tx.wait();

      setClaimedBadges((prev) => ({ ...prev, [id]: true }));
    } catch (e) {
      console.error("Failed to claim badge:", e);
    }
  };

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
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔒</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Connect Wallet to View Profile
            </h2>
            <button
              onClick={connect}
              className="px-8 py-4 bg-gradient-to-r from-solar-gold to-solar-green text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-solar-gold via-solar-green to-solar-blue rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-6xl">
                  👤
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">My Solar Journey</h1>
                  <p className="text-lg opacity-90">
                    {accounts?.[0]?.slice(0, 10)}...{accounts?.[0]?.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                icon="⚡"
                label="Total Solar kWh"
                value={decryptedUserTotal}
                color="gold"
                isLoading={solarTrack.isRefreshing}
              />
              <StatsCard
                icon="🏆"
                label="Environmental Score"
                value={userScore}
                color="green"
              />
              <StatsCard
                icon="🔥"
                label="Current Streak"
                value="0 days"
                color="blue"
              />
            </div>

            {/* Decrypt Section */}
            {solarTrack.totalKwhHandle && !solarTrack.clearTotalKwh && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-solar-blue/30">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  🔓 Decrypt Your Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Your data is encrypted on-chain. Click below to decrypt and view your total solar contribution.
                </p>
                <button
                  onClick={handleDecrypt}
                  disabled={solarTrack.isDecrypting}
                  className="px-6 py-3 bg-solar-blue text-white rounded-lg font-semibold hover:bg-solar-blue/90 disabled:opacity-50 transition-all"
                >
                  {solarTrack.isDecrypting ? "Decrypting..." : "Decrypt My Data"}
                </button>
              </div>
            )}

            {/* Activity Calendar */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-solar-green/30">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">📅</span>
                Activity Calendar
              </h3>
              {/* Month range label */}
              {calendarDays.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  {(() => {
                    const first = calendarDays[0].date;
                    const last = calendarDays[calendarDays.length - 1].date;
                    const fmt = new Intl.DateTimeFormat("zh-CN", {
                      month: "short",
                      day: "numeric",
                    });
                    const yearFmt = new Intl.DateTimeFormat("zh-CN", {
                      year: "numeric",
                    });
                    const sameYear = first.getFullYear() === last.getFullYear();
                    return sameYear
                      ? `${yearFmt.format(first)}年 ${fmt.format(first)} - ${fmt.format(
                          last
                        )}`
                      : `${yearFmt.format(first)}年 ${fmt.format(
                          first
                        )} - ${yearFmt.format(last)}年 ${fmt.format(last)}`;
                  })()}
                </div>
              )}

              {calendarError && (
                <p className="mb-3 text-sm text-red-500">{calendarError}</p>
              )}

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const key = day.date.toISOString().slice(0, 10);
                  const baseColor = day.hasRecord
                    ? "bg-solar-gold/30"
                    : "bg-gray-100";
                  const todayBorder = day.isToday
                    ? "border-2 border-solar-green"
                    : "";

                  return (
                    <div
                      key={key}
                      className={`relative aspect-square rounded-lg ${baseColor} ${todayBorder} hover:scale-110 transition-transform cursor-pointer`}
                      title={day.date.toLocaleDateString("zh-CN")}
                    >
                      <span className="absolute top-1 left-1 text-[10px] text-gray-600">
                        {day.date.getDate()}
                      </span>
                    </div>
                  );
                })}

                {/* Fallback placeholder if calendar still loading */}
                {isCalendarLoading && calendarDays.length === 0 &&
                  Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={`loading-${i}`}
                      className="aspect-square rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
              </div>
              <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>No data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-solar-gold/30 rounded"></div>
                  <span>Logged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-solar-green rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-solar-gold/30">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">🏅</span>
                成就与徽章
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badgeConfigs.map((badge) => {
                  const isClaimed = claimedBadges[badge.id];
                  const canClaim = canClaimBadge(badge.id);
                  const isLocked = !isClaimed && !canClaim;

                  return (
                    <div
                      key={badge.id}
                      className={`text-center p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-between ${
                        isClaimed
                          ? "bg-gradient-to-br from-solar-gold/20 to-solar-gold/5 border-solar-gold/50 shadow-lg"
                          : isLocked
                          ? "bg-gray-100 border-gray-300 opacity-60"
                          : "bg-white border-solar-gold/50"
                      }`}
                    >
                      <div>
                        <div className="text-5xl mb-2">{badge.icon}</div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {badge.name}
                        </p>
                        <p className="text-xs text-gray-500">{badge.description}</p>
                      </div>
                      <div className="mt-4">
                        {isClaimed ? (
                          <span className="text-xs font-semibold text-solar-green">
                            ✅ 已领取
                          </span>
                        ) : canClaim ? (
                          <button
                            onClick={() => claimBadge(badge.id)}
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-solar-gold text-white hover:bg-solar-gold/90 transition-colors"
                          >
                            领取徽章
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">未达成</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

