import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quyền riêng tư | Thật Space",
  description: "Cách Thật Space xử lý dữ liệu cộng đồng và Bà Mối.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Quyền riêng tư</h1>
      <p className="mt-3 text-sm text-[#5C3D2E]/65">Cập nhật ngày 11 tháng 10 năm 2026</p>
      <p className="mt-6">Trang này mô tả dữ liệu Thật Space xử lý khi bạn dùng cộng đồng và Bà Mối trong giai đoạn ra mắt mềm.</p>

      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Tài khoản và điều kiện 18+</h2>
        <p>Bất kỳ ai từ đủ 18 tuổi đều có thể tự đăng ký bằng tài khoản Google, không phân biệt giới tính và không cần lời mời hoặc phê duyệt thủ công. Bạn tự xác nhận điều kiện tuổi; Thật Space không yêu cầu ảnh giấy tờ tùy thân.</p>
        <p>Thật Space xử lý tên, địa chỉ email, tên người dùng, thông tin đăng nhập Google và 16 câu trả lời khi đăng ký để tạo tài khoản, vận hành cộng đồng và hỗ trợ bạn. Các câu trả lời này mặc định không hiện trên hồ sơ hoặc thẻ người dùng; nhân sự có quyền quản trị có thể xem khi cần vận hành và hỗ trợ.</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Cộng đồng</h2>
        <p>Bài viết, hình ảnh, hồ sơ thành viên, sự kiện và tin nhắn riêng trong cộng đồng yêu cầu đăng nhập. Tin nhắn riêng không được mã hóa đầu cuối; quản trị viên có thể truy cập khi cần vận hành, hỗ trợ hoặc kiểm duyệt.</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Bà Mối</h2>
        <p>Bà Mối là tính năng tự nguyện với một lần đồng ý riêng. Câu trả lời đăng ký cộng đồng không tự động trở thành dữ liệu mai mối. Khi tham gia, bạn cung cấp thông tin như mục đích kết nối, giới tính, người muốn gặp, ngày sinh, khu vực, khoảng tuổi, hoàn cảnh gia đình, sở thích và phần giới thiệu.</p>
        <p>Người khác chỉ thấy thẻ ẩn danh đã được bạn duyệt. Trước khi cả hai cùng xác nhận lộ diện, dịch vụ giữ lại thông tin liên hệ và tệp đính kèm. Để nhận ra thông tin liên hệ bị chia nhỏ, dịch vụ tạm lưu tối đa 256 ký tự cuối đã chuyển tiếp của mỗi người trong một kết nối; phần tạm này bị xóa khi lộ diện, kết thúc, chặn hoặc xóa dữ liệu. Quản trị viên vẫn có thể đọc cuộc trò chuyện ẩn danh trong Discourse.</p>
        <p>Bạn có thể tạm dừng, kết thúc kết nối, chặn người khác hoặc yêu cầu xóa dữ liệu mai mối. Xóa dữ liệu Bà Mối loại bỏ các hàng dữ liệu dịch vụ đang hoạt động nhưng không xóa những tin nhắn đã được đăng vào Discourse; bản sao lưu có thể còn tồn tại cho đến khi hết chu kỳ lưu giữ vận hành.</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Nhà cung cấp dịch vụ</h2>
        <p>Thật Space dùng Google cho đăng nhập, Discourse cho cộng đồng và tin nhắn, Vercel cho trang web và API, Supabase cho cơ sở dữ liệu Bà Mối, cùng OpenRouter và Anthropic để xử lý các cuộc trò chuyện với trợ lý AI. Dữ liệu cần thiết có thể được xử lý trên hạ tầng của các nhà cung cấp này theo cấu hình của Thật Space và điều khoản riêng của họ.</p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Yêu cầu và hỗ trợ</h2>
        <p>Bạn có thể dùng trang Liên hệ để hỏi dữ liệu nào đang được xử lý, yêu cầu sửa thông tin, xóa dữ liệu Bà Mối hoặc đóng tài khoản cộng đồng. Một số bản ghi cần thiết cho xử lý sự cố, ngăn lạm dụng và sao lưu có thể được giữ trong thời gian hợp lý rồi loại bỏ theo chu kỳ vận hành.</p>
      </section>
    </article>
  );
}
