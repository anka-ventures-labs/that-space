import type { Metadata } from "next";
import ForumExplorer from "@/components/ForumExplorer";
import PreviewBanner from "@/components/PreviewBanner";
import { getPublicSiteConfig } from "@/lib/public-site";

export const metadata: Metadata = { title: "Forum | Thật Space", description: "Xem trước các cuộc trò chuyện trong cộng đồng Thật Space." };

export default function ForumPage() {
  const site = getPublicSiteConfig();
  const actionHref = site.communityUrl ? `${site.communityUrl}/new-topic` : site.signupHref;
  return <div className="paper-page paper-grain">
    <header className="relative overflow-hidden bg-[#EFE7DA] px-6 pb-24 pt-16"><div className="paper-shell"><PreviewBanner /><div className="mt-9 flex flex-wrap items-end justify-between gap-8"><div className="max-w-2xl"><span className="eyebrow">Diễn đàn · 10 bài viết minh hoạ</span><h1 className="paper-title mt-4 text-[clamp(42px,5vw,68px)]">Cộng Đồng Forum</h1><p className="text-lg leading-relaxed text-[#6E4D3C]">Bản xem trước nơi thành viên chia sẻ, lắng nghe và đồng hành cùng nhau.</p></div><svg width="300" height="120" viewBox="0 0 300 120" aria-hidden="true"><g><polygon points="20,70 130,70 112,96 38,96" fill="#5C3D2E"/><polygon points="20,70 75,70 75,96 38,96" fill="#7A5442"/><polygon points="75,14 75,70 40,70" fill="#C4A882"/><polygon points="75,14 110,70 75,70" fill="#A88B66"/></g><g transform="translate(170 32) scale(.62)"><polygon points="20,70 130,70 112,96 38,96" fill="#A88B66"/><polygon points="20,70 75,70 75,96 38,96" fill="#C4A882"/><polygon points="75,14 75,70 40,70" fill="#FBF8F2"/><polygon points="75,14 110,70 75,70" fill="#E2D4BC"/></g><path d="M0 104 Q25 96 50 104 T100 104 T150 104 T200 104 T250 104 T300 104" fill="none" stroke="#C4A882" strokeWidth="2"/></svg></div></div><div aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-7 bg-[#F5F0E8] [clip-path:polygon(0_100%,0_40%,12.5%_0,25%_40%,37.5%_0,50%_40%,62.5%_0,75%_40%,87.5%_0,100%_40%,100%_100%)]" /></header>
    <ForumExplorer actionHref={actionHref} />
  </div>;
}
