import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublicSiteConfig } from "@/lib/public-site";

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  variable: "--font-fraunces",
  display: "swap",
});

const vietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-vietnam",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://that-space-demo.vercel.app"),
  title: "Thật Space — Kết nối có chủ đích cùng Bà Mối",
  description:
    "Cộng đồng riêng tư và Bà Mối AI dành cho bất kỳ ai từ đủ 18 tuổi muốn kết nối có chủ đích.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicSite = getPublicSiteConfig();

  return (
    <html lang="vi" className={`${fraunces.variable} ${vietnam.variable}`}>
      <body>
        <Navbar
          communityUrl={publicSite.communityUrl}
          publicRegistrationEnabled={publicSite.publicRegistrationEnabled}
        />
        <main>{children}</main>
        <Footer contactHref={publicSite.contactHref} />
      </body>
    </html>
  );
}
