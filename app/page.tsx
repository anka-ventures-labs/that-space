import Image from "next/image";
import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/public-site";

const features = [
  { title: "Bà Mối đồng hành", description: "Trò chuyện riêng với Bà Mối AI, tạo thẻ ẩn danh và nhận những lời giới thiệu có chủ đích." },
  { title: "Bạn giữ quyền quyết định", description: "Chỉ tham gia khi bạn đồng ý riêng; có thể tạm dừng, kết thúc, chặn hoặc xóa dữ liệu mai mối." },
  { title: "Cộng đồng thật", description: "Chia sẻ, portfolio, sự kiện và những cuộc trò chuyện chỉ dành cho thành viên đã đăng nhập." },
];

export default function HomePage() {
  const publicSite = getPublicSiteConfig();

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F0E8] to-[#EDE6D8] px-4 py-20 text-center md:py-24">
        <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-[#C4A882]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-[#C4A882]/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7">
          <Image src="/logo.jpg" alt="Thật Space" width={120} height={120} className="rounded-full border-4 border-[#C4A882] object-cover shadow-xl" priority />
          <div className="space-y-4">
            <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight text-[#5C3D2E] md:text-6xl">Thật Space</h1>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6F47]">Gặp người hợp ý cùng Bà Mối</p>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#5C3D2E]/80 md:text-xl">Một cộng đồng riêng tư để người trưởng thành kết nối có chủ đích — bắt đầu bằng cuộc trò chuyện với Bà Mối.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={publicSite.signupHref} className="rounded-full bg-[#5C3D2E] px-7 py-3 font-medium text-[#F5F0E8] shadow-md transition-colors hover:bg-[#7A5542]">
              {publicSite.publicRegistrationEnabled ? "Tham gia Thật Space" : "Liên hệ Thật Space"}
            </Link>
            {publicSite.loginHref && (
              <Link href={publicSite.loginHref} className="rounded-full border-2 border-[#5C3D2E] px-7 py-3 font-medium text-[#5C3D2E] transition-colors hover:bg-[#5C3D2E] hover:text-[#F5F0E8]">Đăng nhập thành viên</Link>
            )}
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-[#5C3D2E]/70">
            {publicSite.publicRegistrationEnabled
              ? "Bất kỳ ai từ đủ 18 tuổi đều có thể tự đăng ký, không phân biệt giới tính. Đăng nhập bằng Google; không cần lời mời hay chờ phê duyệt thủ công."
              : "Thật Space dành cho bất kỳ ai từ đủ 18 tuổi, không phân biệt giới tính. Kênh đăng ký công khai đang tạm dừng; hãy xem trang Liên hệ để biết trạng thái mới nhất."}
          </p>
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
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#5C3D2E]">Bà Mối là nơi cuộc gặp bắt đầu</h2>
          <div className="mt-5 space-y-4 text-left leading-relaxed text-[#5C3D2E]/75">
            <p>Nhắn riêng với Bà Mối để tham gia tự nguyện, kể điều bạn đang tìm kiếm và duyệt thẻ ẩn danh trước khi xuất hiện trong hộp Duyên.</p>
            <p>Khi hai người cùng muốn làm quen, Thư Duyên mở một phòng trò chuyện ẩn danh. Danh tính và thông tin liên hệ chỉ được mở sau khi cả hai cùng xác nhận.</p>
            <p>Câu trả lời đăng ký cộng đồng không tự động được dùng cho mai mối. Bạn có thể tạm dừng hoặc xóa dữ liệu Bà Mối bất cứ lúc nào.</p>
          </div>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={publicSite.signupHref} className="rounded-full bg-[#5C3D2E] px-6 py-3 font-medium text-[#F5F0E8] transition-colors hover:bg-[#7A5542]">
              {publicSite.publicRegistrationEnabled ? "Bắt đầu với Bà Mối" : "Liên hệ Thật Space"}
            </Link>
            <Link href="/privacy" className="rounded-full border border-[#5C3D2E]/40 px-6 py-3 font-medium text-[#5C3D2E] transition-colors hover:bg-[#5C3D2E]/5">Quyền riêng tư</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
