import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

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

const mockUsePathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({ usePathname: () => mockUsePathname() }));

import Navbar from "@/components/Navbar";

describe("Navbar", () => {
  beforeEach(() => mockUsePathname.mockReturnValue("/"));

  it("renders the public routes and configured community link", () => {
    render(<Navbar communityUrl="https://community.example.test" communityPublicRegistrationEnabled={false} />);
    expect(screen.getAllByRole("link", { name: "Trang chủ" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Cộng đồng" })[0]).toHaveAttribute("href", "https://community.example.test");
    expect(screen.getAllByRole("link", { name: "Quyền riêng tư" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Liên hệ" }).length).toBeGreaterThan(0);
  });

  it("points members to login until public registration is enabled", () => {
    const { rerender } = render(<Navbar communityUrl="https://community.example.test" communityPublicRegistrationEnabled={false} />);
    expect(screen.getByRole("link", { name: "Đăng nhập thành viên" })).toHaveAttribute("href", "https://community.example.test/login");
    rerender(<Navbar communityUrl="https://community.example.test" communityPublicRegistrationEnabled />);
    expect(screen.getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", "https://community.example.test/signup");
  });

  it("opens and closes the mobile menu", () => {
    render(<Navbar communityUrl="https://community.example.test" communityPublicRegistrationEnabled={false} />);
    const menu = screen.getByRole("button", { name: "Chuyển menu" });
    fireEvent.click(menu);
    expect(screen.getAllByRole("link", { name: "Cộng đồng" }).length).toBeGreaterThan(1);
    fireEvent.click(screen.getAllByRole("link", { name: "Cộng đồng" }).at(-1)!);
    expect(screen.getAllByRole("link", { name: "Cộng đồng" })).toHaveLength(1);
  });
});
