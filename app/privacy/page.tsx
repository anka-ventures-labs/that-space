import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quyền riêng tư | Thật Space",
  description: "Cách Thật Space xử lý thông tin cộng đồng và Bà Mối.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Quyền riêng tư</h1>
      <p className="mt-3 text-sm text-[#5C3D2E]/65">Cập nhật ngày 08 tháng 10 năm 2026</p>
      <p className="mt-6">Trang này mô tả cách Thật Space xử lý dữ liệu trong đợt thử nghiệm cộng đồng có giới hạn.</p>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Yêu cầu tham gia và tài khoản</h2>
        <p>Đợt thử nghiệm dành cho bất kỳ ai từ đủ 18 tuổi. Khi nhận lời mời, bạn phải tự xác nhận mình đủ 18 tuổi; Thật Space không yêu cầu ảnh giấy tờ tùy thân cho bước này.</p>
        <p>Thật Space xử lý địa chỉ email, tên hiển thị và thông tin tài khoản cần thiết để gửi lời mời, đăng nhập, hỗ trợ và bảo vệ cộng đồng. Tài khoản mới cần được nhân sự phê duyệt trước khi truy cập.</p>
        <p>15 câu trả lời định hướng cộng đồng là thông tin riêng tư mặc định: thành viên khác không xem được qua hồ sơ hoặc thẻ người dùng. Nhân sự có quyền quản trị có thể xem khi cần vận hành và hỗ trợ.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Cộng đồng</h2>
        <p>Bài viết và hình ảnh trong cộng đồng yêu cầu đăng nhập. Tin nhắn riêng trên diễn đàn không được mã hóa đầu cuối; quản trị viên có thể truy cập chúng khi cần vận hành hoặc kiểm duyệt cộng đồng.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Bà Mối</h2>
        <p>Bà Mối chưa mở trong đợt thử nghiệm cộng đồng đầu tiên. Câu trả lời đăng ký cộng đồng không tự động được dùng để ghép nối.</p>
        <p>Nếu tính năng được mở sau này, Thật Space sẽ yêu cầu một lần đồng ý riêng và công bố rõ dữ liệu nào được dùng, nhà cung cấp AI liên quan, cách tạm dừng, chặn và xóa dữ liệu mai mối.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Hạ tầng dịch vụ</h2>
        <p>Thật Space sử dụng Discourse để vận hành cộng đồng và Vercel để cung cấp trang web công khai. Dữ liệu có thể được xử lý trên hạ tầng của các nhà cung cấp này theo cấu hình vận hành của Thật Space.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Yêu cầu và hỗ trợ</h2>
        <p>Bạn có thể liên hệ đội ngũ để hỏi về dữ liệu của mình, sửa thông tin hoặc yêu cầu đóng tài khoản. Một số bản ghi cần thiết cho an toàn, xử lý sự cố hoặc bản sao lưu có thể được giữ trong thời gian hợp lý rồi loại bỏ theo chu kỳ vận hành.</p>
      </section>
    </article>
  );
}
