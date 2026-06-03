"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const tabSessionKey = "upi-pay-manager-tab-session";

export default function SessionLifecycle() {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;
    if (status !== "authenticated") return;

    const hasActiveTabSession = sessionStorage.getItem(tabSessionKey) === "active";
    if (hasActiveTabSession) return;

    signOut({
      callbackUrl: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
    });
  }, [pathname, status]);

  return null;
}
