import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center text-[#5C3D2E]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C3D2E]/65">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold">Trang này không tồn tại</h1>
      <p className="mt-5 max-w-xl leading-relaxed text-[#5C3D2E]/75">Nội dung bạn tìm có thể đã được gỡ hoặc chỉ dành cho thành viên trong cộng đồng riêng tư.</p>
      <Link href="/" className="mt-8 rounded-full bg-[#5C3D2E] px-6 py-3 font-medium text-[#F5F0E8] transition-colors hover:bg-[#7A5542]">Về trang chủ</Link>
    </section>
  );
}
