"use client";

import { AppProviders } from "@/components/AppProviders";
import { LeaderboardPage } from "@/components/pages/LeaderboardPage";

export default function Leaderboard() {
  return (
    <AppProviders>
      <LeaderboardPage />
    </AppProviders>
  );
}

