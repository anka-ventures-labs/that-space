import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quyền riêng tư | Thật Space",
  description: "Cách Thật Space xử lý thông tin cộng đồng và Bà Mối.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-[#5C3D2E]/80 md:py-20">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#5C3D2E]">Quyền riêng tư</h1>
      <p className="mt-6">Trang này mô tả cách Thật Space vận hành dữ liệu cộng đồng và tính năng Bà Mối.</p>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Đăng nhập và thông tin thành viên</h2>
        <p>Khi bạn đăng nhập bằng Google, Thật Space chỉ yêu cầu thông tin định danh cơ bản: email, tên, ảnh đại diện và mã định danh tài khoản, thông qua các phạm vi openid, email và profile. Thật Space không yêu cầu quyền truy cập Drive, Gmail hoặc Lịch Google.</p>
        <p>15 câu trả lời trong quá trình đăng ký là thông tin riêng tư, chỉ thành viên đó và nhân sự phụ trách của Thật Space được xem để vận hành dịch vụ.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Cộng đồng</h2>
        <p>Bài viết và hình ảnh trong cộng đồng yêu cầu đăng nhập. Tin nhắn riêng trên diễn đàn không được mã hóa đầu cuối; quản trị viên có thể truy cập chúng khi cần vận hành hoặc kiểm duyệt cộng đồng.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Bà Mối</h2>
        <p>Bà Mối chỉ hoạt động khi bạn đồng ý tham gia. Những thông tin và tin nhắn bạn cung cấp cho việc ghép nối có thể được gửi đến dịch vụ AI được cấu hình để tạo gợi ý giới thiệu.</p>
        <p>Số điện thoại chỉ được chia sẻ khi cả hai người cùng đồng ý. Bạn có thể tạm dừng, chặn hoặc yêu cầu xóa dữ liệu Bà Mối. Việc xóa này áp dụng cho dữ liệu của dịch vụ ghép nối; bài viết, lịch sử tin nhắn riêng trên diễn đàn và bản sao lưu có thể vẫn được lưu theo nhu cầu vận hành, lưu trữ và hỗ trợ.</p>
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#5C3D2E]">Hạ tầng dịch vụ</h2>
        <p>Thật Space sử dụng Discourse để vận hành cộng đồng, Vercel để cung cấp dịch vụ web và Supabase cho lưu trữ dịch vụ.</p>
      </section>
    </article>
  );
}
