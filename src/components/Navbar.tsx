"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/forum", label: "Forum" },
  { href: "/tuvi", label: "Tử Vi" },
  { href: "/matchmaking", label: "Matchmaking" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#C4A882]/40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.jpg"
            alt="Thật Space"
            width={44}
            height={44}
            className="rounded-full object-cover border-2 border-[#C4A882] group-hover:border-[#5C3D2E] transition-colors"
          />
          <span className="font-[family-name:var(--font-playfair)] text-[#5C3D2E] text-xl font-semibold hidden sm:block">
            Thật Space
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`font-medium text-sm tracking-wide transition-colors pb-1 ${
                    isActive
                      ? "text-[#5C3D2E] border-b-2 border-[#C4A882]"
                      : "text-[#5C3D2E]/70 hover:text-[#5C3D2E] hover:border-b-2 hover:border-[#C4A882]/50"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/"
              className="bg-[#5C3D2E] text-[#F5F0E8] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#C4A882] transition-colors"
            >
              Join
            </Link>
          </li>
        </ul>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-[#5C3D2E] hover:bg-[#C4A882]/20 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#F5F0E8] border-t border-[#C4A882]/30 px-4 py-4 space-y-3">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? "bg-[#C4A882]/30 text-[#5C3D2E]"
                    : "text-[#5C3D2E]/70 hover:bg-[#C4A882]/20 hover:text-[#5C3D2E]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block bg-[#5C3D2E] text-[#F5F0E8] px-4 py-2 rounded-full text-sm font-medium text-center hover:bg-[#C4A882] transition-colors"
          >
            Join the Community
          </Link>
        </div>
      )}
    </nav>
  );
}
