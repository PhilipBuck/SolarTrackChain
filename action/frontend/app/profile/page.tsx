"use client";

import { AppProviders } from "@/components/AppProviders";
import { ProfilePage } from "@/components/pages/ProfilePage";

export default function Profile() {
  return (
    <AppProviders>
      <ProfilePage />
    </AppProviders>
  );
}

