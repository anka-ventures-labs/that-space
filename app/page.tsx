import Image from "next/image";
import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/public-site";

const features = [
  { title: "Cộng đồng riêng tư", description: "Bài viết, hình ảnh và trao đổi của thành viên chỉ hiển thị sau khi đăng nhập." },
  { title: "Dành cho người từ 18 tuổi", description: "Bất kỳ ai từ đủ 18 tuổi đều có thể gửi yêu cầu tham gia, không phân biệt giới tính." },
  { title: "Thử nghiệm có kiểm soát", description: "Đợt đầu giới hạn một nhóm nhỏ; lời mời và phê duyệt thủ công giúp đội ngũ hỗ trợ sát sao." },
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
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#5C3D2E]/80 md:text-xl">Một không gian riêng tư để kết nối, chia sẻ và tìm người đồng hành.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={publicSite.joinHref} className="rounded-full bg-[#5C3D2E] px-7 py-3 font-medium text-[#F5F0E8] shadow-md transition-colors hover:bg-[#7A5542]">
              {publicSite.intakeOpen ? "Yêu cầu tham gia thử nghiệm" : "Xem trạng thái tiếp nhận"}
            </Link>
            {publicSite.loginHref && (
              <Link href={publicSite.loginHref} className="rounded-full border-2 border-[#5C3D2E] px-7 py-3 font-medium text-[#5C3D2E] transition-colors hover:bg-[#5C3D2E] hover:text-[#F5F0E8]">Đăng nhập thành viên</Link>
            )}
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-[#5C3D2E]/70">
            {publicSite.intakeOpen
              ? "Thật Space đang thử nghiệm với một nhóm nhỏ. Bất kỳ ai từ đủ 18 tuổi đều có thể gửi yêu cầu; đội ngũ sẽ cấp lời mời và phê duyệt thủ công theo sức chứa của đợt thử nghiệm."
              : "Thật Space đang chuẩn bị kênh tiếp nhận cho một nhóm nhỏ. Khi kênh mở, bất kỳ ai từ đủ 18 tuổi đều có thể gửi yêu cầu; đội ngũ sẽ cấp lời mời và phê duyệt thủ công theo sức chứa của đợt thử nghiệm."}
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
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#5C3D2E]">Bà Mối đang được hoàn thiện</h2>
          <div className="mt-5 space-y-4 text-left leading-relaxed text-[#5C3D2E]/75">
            <p>Bà Mối là tính năng thử nghiệm riêng, tự nguyện, dùng AI để hỗ trợ giới thiệu ẩn danh. Tính năng này chưa mở trong đợt thử nghiệm cộng đồng đầu tiên.</p>
            <p>Trước khi mở, Thật Space sẽ kiểm chứng lại cơ chế xác nhận, bảo vệ thông tin liên hệ và quy trình xử lý sự cố. Câu trả lời đăng ký cộng đồng không tự động được đưa vào Bà Mối.</p>
          </div>
          <Link href="/privacy" className="mt-7 inline-block font-medium text-[#5C3D2E] underline decoration-[#8B6F47] underline-offset-4 hover:text-[#7A5542]">Tìm hiểu về quyền riêng tư</Link>
        </div>
      </section>
    </div>
  );
}
