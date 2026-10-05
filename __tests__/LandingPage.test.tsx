import { afterEach, describe, expect, it, vi } from "vitest";
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

import HomePage from "@/app/page";

const originalDiscourseUrl = process.env.DISCOURSE_URL;
const originalRegistration = process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED;

afterEach(() => {
  process.env.DISCOURSE_URL = originalDiscourseUrl;
  process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = originalRegistration;
});

describe("Landing Page", () => {
  it("uses the configured community URL and keeps public registration off by default", () => {
    process.env.DISCOURSE_URL = "https://community.example.test/";
    delete process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED;
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thật Space");
    expect(screen.getByRole("link", { name: "Vào cộng đồng" })).toHaveAttribute("href", "https://community.example.test");
    expect(screen.getByRole("link", { name: "Đăng nhập thành viên beta" })).toHaveAttribute("href", "https://community.example.test/login");
    expect(screen.queryByRole("link", { name: "Đăng ký tham gia" })).not.toBeInTheDocument();
  });

  it("uses signup only when public registration is explicitly enabled", () => {
    process.env.DISCOURSE_URL = "https://community.example.test";
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = "true";
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "Đăng ký tham gia" })).toHaveAttribute("href", "https://community.example.test/signup");
  });

  it("describes member-only community and opt-in Bà Mối controls", () => {
    render(<HomePage />);
    expect(screen.getByText(/Thảo luận, bộ sưu tập ảnh, portfolio và sự kiện/)).toBeInTheDocument();
    expect(screen.getByText(/tạm dừng hoặc chặn kết nối/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /quyền riêng tư/i })).toHaveAttribute("href", "/privacy");
  });
});
