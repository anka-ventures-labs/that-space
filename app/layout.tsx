import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublicSiteConfig } from "@/lib/public-site";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
    <html lang="vi" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-[#F5F0E8] text-[#5C3D2E] font-[family-name:var(--font-inter)]">
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
