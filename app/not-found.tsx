import Link from "next/link";

export default function NotFound() {
  return (
    <section className="paper-grain mx-auto my-16 flex min-h-[55vh] max-w-3xl flex-col items-center justify-center bg-[#FBF8F2] px-8 py-16 text-center text-[#5C3D2E] shadow-[0_2px_0_#E2D4BC,0_20px_30px_-24px_rgba(63,42,31,.55)]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C3D2E]/65">404</p>
      <h1 className="paper-title mt-3 text-5xl">Trang này không tồn tại</h1>
      <p className="mt-5 max-w-xl leading-relaxed text-[#5C3D2E]/75">Nội dung bạn tìm có thể đã được gỡ hoặc chỉ dành cho thành viên trong cộng đồng riêng tư.</p>
      <Link href="/" className="paper-button paper-button-primary mt-8">Về trang chủ</Link>
    </section>
  );
}
