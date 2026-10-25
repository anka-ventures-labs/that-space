import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản cộng đồng | Thật Space",
  description: "Các nguyên tắc tham gia cộng đồng và Bà Mối của Thật Space.",
};

export default function TermsPage() {
  return (
    <article className="legal-paper paper-grain">
      <span className="eyebrow">Legal · Terms</span>
      <h1 className="paper-title mt-3 text-5xl">Điều khoản cộng đồng</h1>
      <p className="mt-3 text-sm text-[#5C3D2E]/65">Cập nhật ngày 11 tháng 10 năm 2026</p>
      <div className="mt-8 space-y-5">
        <p>Thật Space dành cho bất kỳ ai từ đủ 18 tuổi, không phân biệt giới tính. Khi đăng ký, bạn tự xác nhận mình đáp ứng điều kiện tuổi này. Không gửi ảnh giấy tờ tùy thân cho Thật Space.</p>
        <p>Bạn có thể tự đăng ký bằng Google mà không cần lời mời hoặc phê duyệt thủ công. Hãy cung cấp thông tin chính xác, giữ quyền truy cập tài khoản Google của mình và không mạo danh người khác.</p>
        <p>Khi tham gia, bạn đồng ý tôn trọng người khác và quyền riêng tư của họ. Không quấy rối, đe dọa, spam, lừa đảo, đăng nội dung bất hợp pháp hoặc chia sẻ thông tin riêng tư của người khác khi chưa được đồng ý.</p>
        <p>Nội dung cộng đồng dành cho thành viên đã đăng nhập và có thể được đội ngũ kiểm duyệt. Thật Space có thể giới hạn hoặc đóng tài khoản vi phạm các nguyên tắc này hay gây ảnh hưởng nghiêm trọng đến cộng đồng.</p>
        <p>Bà Mối là tính năng tự nguyện và cần sự đồng ý riêng. Gợi ý của AI và điểm tương hợp chỉ hỗ trợ khám phá; chúng có thể sai và không bảo đảm một kết nối, mối quan hệ hoặc kết quả cụ thể. Bạn chịu trách nhiệm cho quyết định gặp gỡ và chia sẻ thêm thông tin của mình.</p>
        <p>Bạn có thể tạm dừng Bà Mối, kết thúc cuộc trò chuyện, chặn một người hoặc yêu cầu xóa dữ liệu mai mối. Hãy dùng trang Liên hệ để báo cáo vấn đề, hỏi về tài khoản hoặc yêu cầu hỗ trợ dữ liệu.</p>
      </div>
    </article>
  );
}
