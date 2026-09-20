import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/inter";
import "./globals.css";
import { AppProviders } from "@/lib/providers";
import AgriFlowChat from "@/components/AgriFlowChat";

export const metadata: Metadata = {
  title: "AgriFlow — Farming, paid on delivery",
  description:
    "The marketplace that pays farmers on delivery. Direct offers, escrow-secured payments and payouts through Mobile Money today — with more channels on the way.",
  applicationName: "AgriFlow",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f7a4d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}<AgriFlowChat /></AppProviders>
      </body>
    </html>
  );
}

