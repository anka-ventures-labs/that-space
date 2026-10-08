import Image from "next/image";
import Link from "next/link";

type FooterProps = {
  contactHref?: string;
};

export default function Footer({ contactHref = "/contact" }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-[#C4A882]/40 bg-[#F5F0E8] py-12 text-[#5C3D2E]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4">
        <Link href="/" className="group flex items-center gap-3">
          <Image src="/logo.jpg" alt="Thật Space" width={56} height={56} className="rounded-full border-2 border-[#C4A882] object-cover transition-colors group-hover:border-[#5C3D2E]" />
        </Link>
        <p className="text-center font-[family-name:var(--font-playfair)] text-lg font-semibold">Thật Space — Kết nối, chia sẻ và tìm người đồng hành.</p>
        <nav aria-label="Liên kết chân trang" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/privacy" className="transition-colors hover:text-[#7A5542]">Quyền riêng tư</Link>
          <Link href="/terms" className="transition-colors hover:text-[#7A5542]">Điều khoản</Link>
          <Link href={contactHref} className="transition-colors hover:text-[#7A5542]">Liên hệ</Link>
        </nav>
        <p className="text-center text-sm text-[#5C3D2E]/70">© {new Date().getFullYear()} Thật Space</p>
      </div>
    </footer>
  );
}
