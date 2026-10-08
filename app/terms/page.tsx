import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản cộng đồng | Thật Space",
  description: "Các nguyên tắc tham gia cộng đồng Thật Space.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Điều khoản cộng đồng</h1>
      <p className="mt-3 text-sm text-[#5C3D2E]/65">Cập nhật ngày 08 tháng 10 năm 2026</p>
      <div className="mt-8 space-y-5">
        <p>Thật Space dành cho bất kỳ ai từ đủ 18 tuổi, không phân biệt giới tính. Khi chấp nhận lời mời, bạn xác nhận mình đáp ứng điều kiện tuổi này.</p>
        <p>Trong đợt thử nghiệm, số lượng thành viên được giới hạn. Yêu cầu tham gia không bảo đảm được cấp lời mời; tài khoản được phê duyệt thủ công để phù hợp với sức chứa và khả năng hỗ trợ của đội ngũ.</p>
        <p>Khi tham gia Thật Space, bạn đồng ý tôn trọng người khác và quyền riêng tư của họ. Không đăng nội dung quấy rối, đe dọa, spam hoặc chia sẻ thông tin riêng tư của người khác khi chưa được đồng ý.</p>
        <p>Nội dung trong cộng đồng dành cho thành viên đã đăng nhập và có thể được đội ngũ kiểm duyệt để giữ không gian an toàn, tôn trọng.</p>
        <p>Bà Mối chưa mở trong đợt thử nghiệm cộng đồng đầu tiên. Nếu được mở sau này, tính năng sẽ cần sự đồng ý riêng; gợi ý của AI có thể sai và không bảo đảm một kết nối, mối quan hệ hay kết quả cụ thể.</p>
        <p>Hãy liên hệ đội ngũ nếu bạn gặp vấn đề an toàn, muốn báo cáo nội dung hoặc cần hỗ trợ tài khoản.</p>
      </div>
    </article>
  );
}
