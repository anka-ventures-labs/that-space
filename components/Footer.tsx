import Image from "next/image";
import Link from "next/link";

export default function Footer({ contactHref = "/contact" }: { contactHref?: string }) {
  return (
    <footer className="paper-footer paper-grain">
      <div className="paper-shell flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="paper-logo"><Image src="/logo.jpg" alt="Thật Space" width={56} height={56} /></Link>
          <p className="serif m-0 max-w-sm text-lg text-[#F5F0E8]">A private space to connect, grow, and discover.</p>
        </div>
        <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
          <Link href="/forum" className="hover:text-white">Forum</Link>
          <Link href="/tuvi" className="hover:text-white">Tử Vi</Link>
          <Link href="/matchmaking" className="hover:text-white">Tìm Duyên</Link>
          <Link href="/privacy" className="hover:text-white">Quyền riêng tư</Link>
          <Link href="/terms" className="hover:text-white">Điều khoản</Link>
          <Link href={contactHref} className="hover:text-white">Liên hệ</Link>
        </nav>
        <p className="m-0 w-full border-t border-dashed border-[#E2D4BC]/30 pt-6 text-sm text-[#C4A882]">© {new Date().getFullYear()} Thật Space. All rights reserved.</p>
      </div>
    </footer>
  );
}
