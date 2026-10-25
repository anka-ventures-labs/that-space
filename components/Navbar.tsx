"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavbarProps = { communityUrl: string; publicRegistrationEnabled: boolean };

export default function Navbar({ communityUrl, publicRegistrationEnabled }: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const community = communityUrl.trim().replace(/\/+$/, "");
  const navLinks = [
    { href: "/forum", label: "Forum" },
    { href: "/tuvi", label: "Tử Vi" },
    { href: "/matchmaking", label: "Tìm Duyên" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="paper-nav" aria-label="Main">
      <div className="paper-nav-inner">
        <Link href="/" className="paper-logo" aria-label="Thật Space — Trang chủ">
          <Image src="/logo.jpg" alt="Thật Space" width={48} height={48} priority />
        </Link>
        <div id="mobile-navigation" className="paper-nav-links" data-open={menuOpen}>
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href === "/forum" && pathname.startsWith("/forum/"));
            return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className="paper-nav-link" onClick={() => setMenuOpen(false)}>{link.label}</Link>;
          })}
          {community && <Link href={`${community}/login`} className="paper-nav-link" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>}
          <Link href={publicRegistrationEnabled && community ? `${community}/signup` : "/contact"} className="paper-button paper-button-primary ml-2 min-h-11 px-5 text-[15px]" onClick={() => setMenuOpen(false)}>
            {publicRegistrationEnabled ? "Join" : "Liên hệ"}
          </Link>
        </div>
        <button className="paper-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Chuyển menu" aria-expanded={menuOpen} aria-controls="mobile-navigation">
          {menuOpen ? "×" : "☰"}
        </button>
      </div>
    </nav>
  );
}
