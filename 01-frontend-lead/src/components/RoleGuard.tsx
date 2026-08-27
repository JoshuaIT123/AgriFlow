"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, panelHome } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { PanelShell, type PanelTab } from "./PanelShell";
import type { Role } from "@/lib/types";

export function RoleGuard({
  role,
  tabs,
  roleLabelKey,
  children,
}: {
  role: Role;
  tabs: PanelTab[];
  roleLabelKey: string;
  children: ReactNode;
}) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    // Wait for the stored token to be validated; otherwise a refresh would
    // bounce a signed-in user to /login before /api/auth/me answers.
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(panelHome(user.role));
    }
  }, [ready, user, role, router]);

  if (!ready || !user) {
    return <div className="spinner">{t("common.loading")}</div>;
  }

  if (user.role !== role) {
    return <div className="spinner">{t("common.loading")}</div>;
  }

  return (
    <PanelShell tabs={tabs} roleLabelKey={roleLabelKey}>
      {children}
    </PanelShell>
  );
}
