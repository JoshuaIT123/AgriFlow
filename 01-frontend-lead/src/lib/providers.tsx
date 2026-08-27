"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "./i18n-context";
import { AuthProvider } from "./auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
