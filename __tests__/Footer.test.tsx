import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

import Footer from "@/components/Footer";

describe("Footer", () => {
  it("includes privacy, terms, and the configured contact destination", () => {
    render(<Footer contactHref="mailto:support@example.test" />);
    expect(screen.getByRole("link", { name: "Quyền riêng tư" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Điều khoản" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Liên hệ" })).toHaveAttribute("href", "mailto:support@example.test");
  });
});
