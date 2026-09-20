"use client";

import { Suspense } from "react";
import { UserChat } from "@/components/UserChat";
import { useI18n } from "@/lib/i18n-context";

function ChatPageInner() {
  return <UserChat />;
}

export default function ChatPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="spinner">{t("common.loading")}</div>}>
      <ChatPageInner />
    </Suspense>
  );
}