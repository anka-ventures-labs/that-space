import Image from "next/image";
import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/public-site";

const features = [
  { title: "Cộng đồng thành viên", description: "Thảo luận, bộ sưu tập ảnh, portfolio và sự kiện dành cho các thành viên của Thật Space." },
  { title: "Bà Mối", description: "Một lựa chọn tự nguyện để nhận gợi ý làm quen ẩn danh với sự hỗ trợ của AI." },
  { title: "Quyền chủ động", description: "Bạn có thể tạm dừng, chặn hoặc xóa dữ liệu mai mối của mình bất cứ lúc nào." },
];

export default function HomePage() {
  const publicSite = getPublicSiteConfig();
  const memberCtaHref = publicSite.communityPublicRegistrationEnabled ? publicSite.signupHref : publicSite.loginHref;
  const memberCtaLabel = publicSite.communityPublicRegistrationEnabled ? "Đăng ký tham gia" : "Đăng nhập thành viên beta";

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F0E8] to-[#EDE6D8] px-4 py-20 text-center md:py-24">
        <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-[#C4A882]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-[#C4A882]/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7">
          <Image src="/logo.jpg" alt="Thật Space" width={120} height={120} className="rounded-full border-4 border-[#C4A882] object-cover shadow-xl" priority />
          <div className="space-y-4">
            <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight text-[#5C3D2E] md:text-6xl">Thật Space</h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#5C3D2E]/80 md:text-xl">Một không gian để kết nối, chia sẻ và tìm người đồng hành.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={publicSite.communityHref} className="rounded-full bg-[#5C3D2E] px-7 py-3 font-medium text-[#F5F0E8] shadow-md transition-colors hover:bg-[#C4A882]">Vào cộng đồng</Link>
            <Link href={memberCtaHref} className="rounded-full border-2 border-[#5C3D2E] px-7 py-3 font-medium text-[#5C3D2E] transition-colors hover:bg-[#5C3D2E] hover:text-[#F5F0E8]">{memberCtaLabel}</Link>
          </div>
          {!publicSite.communityPublicRegistrationEnabled && (
            <p className="max-w-lg text-sm leading-relaxed text-[#5C3D2E]/70">Thật Space đang mở cho thành viên beta. Đăng ký công khai sẽ được thông báo khi sẵn sàng.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#5C3D2E] md:text-4xl">Dành cho những kết nối có chủ đích</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-[#C4A882]/30 bg-white/60 p-7 text-center shadow-sm">
              <h3 className="mb-3 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#5C3D2E]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#5C3D2E]/75">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#5C3D2E]/5 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#C4A882]/30 bg-white/60 p-8 text-center md:p-10">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#5C3D2E]">Làm quen qua Bà Mối</h2>
          <div className="mt-5 space-y-4 text-left leading-relaxed text-[#5C3D2E]/75">
            <p>Bà Mối là tính năng tùy chọn dùng AI để hỗ trợ giới thiệu ẩn danh. Bạn quyết định có tham gia hay không.</p>
            <p>Số điện thoại chỉ được chia sẻ khi cả hai người cùng đồng ý. Bạn luôn có thể tạm dừng hoặc chặn kết nối.</p>
            <p>Tính năng này cần 15 câu trả lời khi đăng ký để hỗ trợ ghép nối; chỉ bạn và đội ngũ phụ trách mới xem được các câu trả lời đó.</p>
          </div>
          <Link href="/privacy" className="mt-7 inline-block font-medium text-[#5C3D2E] underline decoration-[#C4A882] underline-offset-4 hover:text-[#C4A882]">Tìm hiểu về quyền riêng tư</Link>
        </div>
      </section>
    </div>
  );
}
