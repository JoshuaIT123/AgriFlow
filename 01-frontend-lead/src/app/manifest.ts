import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgriFlow — Farming, paid on delivery",
    short_name: "AgriFlow",
    description:
      "A secure, simple platform that pays farmers reliably through Mobile Money.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f3",
    theme_color: "#1f7a4d",
    orientation: "portrait",
    lang: "en",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
