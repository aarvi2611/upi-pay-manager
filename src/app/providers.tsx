"use client";

import { SessionProvider } from "next-auth/react";
import SessionLifecycle from "@/components/SessionLifecycle";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionLifecycle />
      {children}
    </SessionProvider>
  );
}
