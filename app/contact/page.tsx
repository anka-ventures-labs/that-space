import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Liên hệ | Thật Space",
  description: "Liên hệ đội ngũ Thật Space.",
};

export default function ContactPage() {
  const { supportEmail, communityHref, contactHref } = getPublicSiteConfig();
  const communityAboutHref = communityHref === "/" ? "/contact" : `${communityHref}/about`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Liên hệ</h1>
      <p className="mt-6">Đội ngũ Thật Space sẵn sàng tiếp nhận câu hỏi và phản hồi về cộng đồng.</p>
      {supportEmail ? (
        <Link href={contactHref} className="mt-6 inline-block font-medium text-[#5C3D2E] underline decoration-[#C4A882] underline-offset-4 hover:text-[#C4A882]">Gửi email cho đội ngũ</Link>
      ) : (
        <Link href={communityAboutHref} className="mt-6 inline-block font-medium text-[#5C3D2E] underline decoration-[#C4A882] underline-offset-4 hover:text-[#C4A882]">Liên hệ qua trang cộng đồng</Link>
      )}
    </article>
  );
}
