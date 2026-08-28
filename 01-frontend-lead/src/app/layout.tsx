import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/providers";
import WandaaChat from "@/components/WandaaChat";

export const metadata: Metadata = {
  title: "AgriFlow â€” Farming, paid on delivery",
  description:
    "A secure, simple platform that pays farmers reliably through Mobile Money.",
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
        <AppProviders>{children}<WandaaChat /></AppProviders>
      </body>
    </html>
  );
}

