"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { isAdminActive } from "@/lib/admin";
import { hydrate } from "@/lib/remote";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminActive()) {
      router.replace("/admin/login");
      return;
    }
    // Best-effort refresh so the console sees the latest listings. This only
    // moves data if a signed-in session token exists; otherwise it's a no-op.
    (async () => {
      try {
        await hydrate("buyer");
      } catch {
        // keep whatever cache exists
      }
    })();
  }, [router]);

  if (!isAdminActive()) {
    return <div className="spinner">{t("common.loading")}</div>;
  }

  return <AdminShell>{children}</AdminShell>;
}