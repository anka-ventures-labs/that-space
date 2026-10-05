import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản cộng đồng | Thật Space",
  description: "Các nguyên tắc tham gia cộng đồng Thật Space.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Điều khoản cộng đồng</h1>
      <div className="mt-8 space-y-5">
        <p>Khi tham gia Thật Space, bạn đồng ý tôn trọng người khác và quyền riêng tư của họ. Không đăng nội dung quấy rối, đe dọa, spam hoặc chia sẻ thông tin riêng tư của người khác khi chưa được đồng ý.</p>
        <p>Nội dung trong cộng đồng dành cho thành viên đã đăng nhập và có thể được đội ngũ kiểm duyệt để giữ không gian an toàn, tôn trọng.</p>
        <p>Bà Mối dành cho người từ 18 tuổi trở lên. Gợi ý của AI có thể sai và không đảm bảo một kết nối, mối quan hệ hay kết quả cụ thể nào.</p>
        <p>Bạn có thể chặn người khác hoặc tạm dừng tham gia Bà Mối. Hãy liên hệ đội ngũ nếu bạn gặp vấn đề trong cộng đồng hoặc khi sử dụng tính năng này.</p>
      </div>
    </article>
  );
}
