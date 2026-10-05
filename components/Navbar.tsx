"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavbarProps = {
  communityUrl: string;
  communityPublicRegistrationEnabled: boolean;
};

export default function Navbar({
  communityUrl,
  communityPublicRegistrationEnabled,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const communityHref = communityUrl || "/";
  const membershipHref = communityUrl
    ? `${communityUrl}/${communityPublicRegistrationEnabled ? "signup" : "login"}`
    : `/${communityPublicRegistrationEnabled ? "signup" : "login"}`;
  const membershipLabel = communityPublicRegistrationEnabled
    ? "Đăng ký"
    : "Đăng nhập thành viên";
  const navLinks = [
    { href: "/", label: "Trang chủ", external: false },
    { href: communityHref, label: "Cộng đồng", external: Boolean(communityUrl) },
    { href: "/privacy", label: "Quyền riêng tư", external: false },
    { href: "/contact", label: "Liên hệ", external: false },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#C4A882]/40 bg-[#F5F0E8]/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <Image src="/logo.jpg" alt="Thật Space" width={44} height={44} className="rounded-full border-2 border-[#C4A882] object-cover transition-colors group-hover:border-[#5C3D2E]" />
          <span className="hidden font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#5C3D2E] sm:block">Thật Space</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => {
            const isActive = !link.external && pathname === link.href;
            return (
              <li key={link.href}>
                <Link href={link.href} className={`pb-1 text-sm font-medium tracking-wide transition-colors ${isActive ? "border-b-2 border-[#C4A882] text-[#5C3D2E]" : "text-[#5C3D2E]/70 hover:border-b-2 hover:border-[#C4A882]/50 hover:text-[#5C3D2E]"}`}>
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link href={membershipHref} className="rounded-full bg-[#5C3D2E] px-4 py-2 text-sm font-medium text-[#F5F0E8] transition-colors hover:bg-[#C4A882]">
              {membershipLabel}
            </Link>
          </li>
        </ul>

        <button className="rounded-md p-2 text-[#5C3D2E] transition-colors hover:bg-[#C4A882]/20 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Chuyển menu">
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="space-y-3 border-t border-[#C4A882]/30 bg-[#F5F0E8] px-4 py-4 md:hidden">
          {navLinks.map((link) => {
            const isActive = !link.external && pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-[#C4A882]/30 text-[#5C3D2E]" : "text-[#5C3D2E]/70 hover:bg-[#C4A882]/20 hover:text-[#5C3D2E]"}`}>
                {link.label}
              </Link>
            );
          })}
          <Link href={membershipHref} onClick={() => setMenuOpen(false)} className="block rounded-full bg-[#5C3D2E] px-4 py-2 text-center text-sm font-medium text-[#F5F0E8] transition-colors hover:bg-[#C4A882]">
            {membershipLabel}
          </Link>
        </div>
      )}
    </nav>
  );
}
