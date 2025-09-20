"use client";

import { Suspense } from "react";
import Profile from "@/components/Profile";
import OAuthHandler from "@/components/OAuthHandler";

function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OAuthHandler />
      </Suspense>
      <Profile />
    </div>
  );
}

export default DashboardPage;
