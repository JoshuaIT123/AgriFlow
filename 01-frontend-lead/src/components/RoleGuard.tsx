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
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(panelHome(user.role));
    }
  }, [user, role, router]);

  if (!user) {
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
