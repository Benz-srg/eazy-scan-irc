import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Noto_Sans_Mono } from "next/font/google";
import { Providers } from "@/components/app/Providers";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-thai",
  display: "swap",
});

const notoMono = Noto_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE = "https://eazyscan.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "EazyScan — เปลี่ยนเสียงลูกค้าให้เป็น Scope งานและ Manday",
    template: "%s · EazyScan",
  },
  description:
    "EazyScan ผู้ช่วย AI ที่เปลี่ยนเสียงสนทนา Requirement ของลูกค้าให้กลายเป็น Scope of Work และการประเมิน Manday ภายในไม่กี่นาที",
  keywords: [
    "AI Manday Estimator",
    "Scope of Work",
    "ประเมิน Manday",
    "ถอดเสียง requirement",
    "Speech to Text",
    "Project Manager",
  ],
  applicationName: "EazyScan",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: SITE,
    siteName: "EazyScan",
    title: "EazyScan — เปลี่ยนเสียงลูกค้าให้เป็น Scope งานและ Manday",
    description:
      "อัปโหลดไฟล์เสียงหรืออัดเสียงโดยตรง ให้ AI วิเคราะห์ Requirement พร้อมสร้าง SOW, ประเมิน Manday และคำถามที่ควรถามลูกค้า",
  },
  twitter: {
    card: "summary_large_image",
    title: "EazyScan — เปลี่ยนเสียงลูกค้าให้เป็น Scope งานและ Manday",
    description:
      "เปลี่ยนเสียงสนทนา Requirement ให้เป็น Scope of Work และ Manday ด้วย AI",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${notoThai.variable} ${notoMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
