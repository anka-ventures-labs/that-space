import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Liên hệ | Thật Space",
  description: "Liên hệ đội ngũ Thật Space.",
};

export default function ContactPage() {
  const { supportEmail, contactHref, communityUrl, loginHref, signupHref, publicRegistrationEnabled } = getPublicSiteConfig();

  return (
    <article className="legal-paper paper-grain">
      <span className="eyebrow">Support</span>
      <h1 className="paper-title mt-3 text-5xl">Liên hệ</h1>
      <p className="mt-6">Bạn có thể liên hệ để hỏi về tài khoản, dữ liệu, cộng đồng hoặc Bà Mối. Thật Space không yêu cầu bạn gửi ảnh giấy tờ tùy thân.</p>
      {supportEmail ? (
        <Link href={contactHref} className="paper-button paper-button-primary mt-6">Gửi email cho đội ngũ</Link>
      ) : communityUrl ? (
        <div className="paper-sheet mt-6 space-y-4 border-l-4 border-[#C4A882] p-5">
          <p>
            {publicRegistrationEnabled
              ? "Kênh email công khai chưa được cấu hình. Thành viên có thể đăng nhập rồi liên hệ đội ngũ trong cộng đồng; người mới có thể tự đăng ký trước."
              : "Kênh email công khai chưa được cấu hình. Thành viên hiện tại có thể đăng nhập rồi liên hệ đội ngũ trong cộng đồng; đăng ký mới đang tạm dừng."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {publicRegistrationEnabled && (
              <Link href={signupHref} className="font-medium text-[#5C3D2E] underline decoration-[#8B6F47] underline-offset-4 hover:text-[#7A5542]">Đăng ký bằng Google</Link>
            )}
            {loginHref && (
              <Link href={loginHref} className="font-medium text-[#5C3D2E] underline decoration-[#8B6F47] underline-offset-4 hover:text-[#7A5542]">Đăng nhập để nhận hỗ trợ</Link>
            )}
          </div>
        </div>
      ) : (
        <p className="paper-sheet mt-6 border-l-4 border-[#C4A882] p-5">Kênh hỗ trợ đang được cấu hình. Bạn vẫn có thể quay lại trang này sau.</p>
      )}
    </article>
  );
}
