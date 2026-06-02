import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EazyScan — AI Manday Estimator",
    short_name: "EazyScan",
    description:
      "เปลี่ยนเสียงสนทนา Requirement ของลูกค้าให้เป็น Scope of Work และการประเมิน Manday ด้วย AI",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fb",
    theme_color: "#6366f1",
    lang: "th",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
