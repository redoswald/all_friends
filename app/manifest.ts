import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tend",
    short_name: "Tend",
    description:
      "Be the friend you wish you had. Track interactions, set reminders, and nurture your relationships.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAFAFE",
    theme_color: "#FAFAFE",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
