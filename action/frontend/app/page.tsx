"use client";

import { Dashboard } from "@/components/pages/Dashboard";
import { AppProviders } from "@/components/AppProviders";

export default function Home() {
  return (
    <AppProviders>
      <Dashboard />
    </AppProviders>
  );
}
