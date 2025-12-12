"use client";

import { AppProviders } from "@/components/AppProviders";
import { LogUsagePage } from "@/components/pages/LogUsagePage";

export default function LogPage() {
  return (
    <AppProviders>
      <LogUsagePage />
    </AppProviders>
  );
}

