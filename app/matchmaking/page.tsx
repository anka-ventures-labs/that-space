import type { Metadata } from "next";
import MatchmakingGallery from "@/components/MatchmakingGallery";
import PreviewBanner from "@/components/PreviewBanner";
import { getPublicSiteConfig } from "@/lib/public-site";

export const metadata: Metadata = { title: "Tìm Duyên | Thật Space", description: "Khám phá trải nghiệm kết nối có chủ đích cùng Bà Mối.", robots: { index: false, follow: false } };

export default function MatchmakingPage() {
  const site = getPublicSiteConfig();
  return <div className="paper-page paper-grain">
    <header className="page-hero"><div className="paper-shell"><PreviewBanner /><div className="mt-10 flex flex-wrap items-center justify-between gap-10"><div className="max-w-3xl"><span className="eyebrow">Spiritual matchmaking</span><h1 className="paper-title mt-4 text-[clamp(42px,5vw,72px)]">Tìm <em className="text-[#8A6450]">Duyên</em></h1><p className="text-lg leading-relaxed text-[#6E4D3C]">Kết nối có chủ đích vượt qua tương hợp bề mặt: trò chuyện riêng, thẻ ẩn danh do bạn duyệt và lộ diện chỉ khi cả hai cùng chọn.</p><p className="text-sm leading-relaxed text-[#7A5A48]">Tử Vi là một lớp ngôn ngữ suy ngẫm; ghép đôi thật dựa trên thông tin bạn tự nguyện chia sẻ, ranh giới và sự đồng thuận.</p></div><svg width="320" height="180" viewBox="0 0 320 180" aria-hidden="true"><g transform="translate(20 50)"><polygon points="52,44 74,2 66,46" fill="#A88B66"/><polygon points="8,26 42,44 34,50" fill="#8A6450"/><polygon points="34,50 60,40 80,52 54,62" fill="#C4A882"/><polygon points="44,46 26,4 64,44" fill="#DCCAAE"/><polygon points="74,48 104,14 82,52" fill="#A88B66"/></g><g transform="translate(300 50) scale(-1 1)"><polygon points="52,44 74,2 66,46" fill="#3F2A1F"/><polygon points="8,26 42,44 34,50" fill="#5C3D2E"/><polygon points="34,50 60,40 80,52 54,62" fill="#7A5442"/><polygon points="44,46 26,4 64,44" fill="#8A6450"/><polygon points="74,48 104,14 82,52" fill="#5C3D2E"/></g><path d="M60 140 C120 170 200 170 260 140" fill="none" stroke="#C4A882" strokeWidth="2" strokeDasharray="3 6"/><polygon points="160,122 166,136 180,142 166,148 160,162 154,148 140,142 154,136" fill="#C4A882"/></svg></div></div></header>
    <section className="paper-shell py-20"><MatchmakingGallery joinHref={site.signupHref} /></section>
  </div>;
}
