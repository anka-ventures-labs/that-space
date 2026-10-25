import Link from "next/link";
import OrigamiLotus from "@/components/OrigamiLotus";
import PaperSteps from "@/components/PaperSteps";
import { getPublicSiteConfig } from "@/lib/public-site";

const features = [
  { href: "/forum", n: "01 · Diễn đàn", title: "Forum", body: "Connect with people who understand your journey. Share stories, seek wisdom, and find your circle in warm community spaces." },
  { href: "/tuvi", n: "02 · Lá số", title: "Tử Vi Horoscope", body: "Explore a personal Tử Vi experience rooted in Vietnamese astrology and discover prompts for love, career, and spiritual reflection." },
  { href: "/matchmaking", n: "03 · Tìm duyên", title: "Matchmaking", body: "Meet Bà Mối in private, review anonymous cards, and open contact only after both people explicitly choose to reveal." },
];

export default function HomePage() {
  const site = getPublicSiteConfig();
  return (
    <div className="paper-page paper-grain">
      <OrigamiLotus signupHref={site.signupHref} loginHref={site.loginHref} registrationOpen={site.publicRegistrationEnabled} />

      <section className="dark-fold-section">
        <div className="paper-shell">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <h2 className="paper-title max-w-2xl text-[clamp(36px,4.4vw,60px)]">Everything you need to <em className="text-[#C4A882]">flourish</em></h2>
            <p className="m-0 max-w-sm leading-relaxed text-[#E2D4BC]">Three pillars of connection, wisdom, and belonging — folded into one private space.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => <Link key={feature.href} href={feature.href} className="feature-card fold-card paper-grain"><svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={feature.href === "/forum" ? "M6 10h30v20H18l-8 7v-7H6zM24 34h8l8 8v-8h10V18h-8" : feature.href === "/tuvi" ? "M28 4l6 18 18 6-18 6-6 18-6-18-18-6 18-6zM28 4v48M4 28h48" : "M28 50 6 26l6-14 16 8 16-8 6 14zM28 20v30M6 26h44"} /></svg><span className="eyebrow">{feature.n}</span><h3 className="serif m-0 text-3xl font-medium">{feature.title}</h3><p className="m-0 leading-relaxed text-[#6E4D3C]">{feature.body}</p><span className="mt-auto font-semibold">Explore →</span></Link>)}
          </div>
        </div>
      </section>

      <section className="paper-shell py-28">
        <div className="mb-12 max-w-2xl"><span className="eyebrow">How it unfolds</span><h2 className="paper-title mt-4 text-[clamp(34px,4vw,54px)]">One sheet of paper, four folds.</h2><p className="text-[#6E4D3C]">Hover or tap each fold to open it.</p></div>
        <PaperSteps />
      </section>

      <section className="paper-shell pb-28">
        <h2 className="paper-title mb-14 text-center text-[clamp(34px,4vw,54px)]">Built for honest connection</h2>
        <div className="grid items-start gap-10 md:grid-cols-3">
          {[[-2,"R","Riêng tư theo mặc định","Hồ sơ mai mối chỉ xuất hiện khi bạn đồng ý và duyệt thẻ ẩn danh của mình."],[1.5,"C","Cả hai cùng chọn","Thông tin liên hệ chỉ mở khi hai người cùng xác nhận; bạn luôn có thể tạm dừng hoặc kết thúc."],[-1,"B","Bạn giữ quyền quyết định","Chặn, xóa dữ liệu mai mối và nhận hỗ trợ đều là những đường đi có thật trong sản phẩm."]].map(([tilt,initial,title,body]) => <article key={String(title)} className="paper-note paper-grain" style={{ transform: `rotate(${tilt}deg)` }}><div className="avatar-fold mb-5 h-11 w-11">{initial}</div><h3 className="serif text-xl font-medium">{title}</h3><p className="leading-relaxed text-[#6E4D3C]">{body}</p></article>)}
        </div>
      </section>

      <section className="paper-shell pb-28">
        <div className="cta-sheet paper-grain flex flex-col items-center gap-6">
          <h2 className="paper-title relative z-10 text-[clamp(36px,4.6vw,64px)] text-[#3F2A1F]">Ready to find your space?</h2>
          <p className="relative z-10 m-0 max-w-xl leading-relaxed text-[#3F2A1F]">Join a Vietnamese community designed for deeper connection, thoughtful conversation, and voluntary matchmaking with Bà Mối.</p>
          <Link href={site.signupHref} className="paper-button paper-button-primary relative z-10 mt-2 px-9">{site.publicRegistrationEnabled ? "Join the Community — It’s Free" : "Xem cách tham gia"}</Link>
        </div>
      </section>
    </div>
  );
}
