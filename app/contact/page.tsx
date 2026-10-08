import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Liên hệ | Thật Space",
  description: "Liên hệ đội ngũ Thật Space.",
};

export default function ContactPage() {
  const { supportEmail, contactHref } = getPublicSiteConfig();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Liên hệ</h1>
      <p className="mt-6">Bạn từ đủ 18 tuổi có thể liên hệ để yêu cầu lời mời thử nghiệm, đặt câu hỏi hoặc báo cáo vấn đề an toàn. Hãy cho đội ngũ biết bạn muốn tham gia với mục đích gì; không gửi ảnh giấy tờ tùy thân.</p>
      {supportEmail ? (
        <Link href={contactHref} className="mt-6 inline-block font-medium text-[#5C3D2E] underline decoration-[#8B6F47] underline-offset-4 hover:text-[#7A5542]">Gửi email cho đội ngũ</Link>
      ) : (
        <p className="mt-6 rounded-xl border border-[#C4A882]/40 bg-white/60 p-5">Kênh tiếp nhận yêu cầu đang được cấu hình. Thật Space chưa nhận thành viên mới cho đến khi địa chỉ hỗ trợ xuất hiện tại đây.</p>
      )}
    </article>
  );
}
