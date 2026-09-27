import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#F5F0E8] border-t border-[#C4A882]/40 text-[#5C3D2E] py-12 mt-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.jpg"
            alt="Thật Space"
            width={56}
            height={56}
            className="rounded-full object-cover border-2 border-[#C4A882] group-hover:border-[#5C3D2E] transition-colors"
          />
        </Link>
        <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-center">
          Thật Space — A private space for women to connect, grow, and discover
        </p>
        <p className="text-sm text-[#C4A882] text-center">
          © 2024 Thật Space. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
