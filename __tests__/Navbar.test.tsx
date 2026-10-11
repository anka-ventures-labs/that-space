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
    render(<Navbar communityUrl="https://community.example.test" publicRegistrationEnabled />);
    expect(screen.getAllByRole("link", { name: "Trang chủ" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Cộng đồng" })[0]).toHaveAttribute("href", "https://community.example.test");
    expect(screen.getAllByRole("link", { name: "Quyền riêng tư" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Liên hệ" }).length).toBeGreaterThan(0);
  });

  it("shows member login and direct public signup", () => {
    render(<Navbar communityUrl="https://community.example.test/" publicRegistrationEnabled />);
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "https://community.example.test/login");
    expect(screen.getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", "https://community.example.test/signup");
  });

  it("omits community links when no community URL is configured", () => {
    render(<Navbar communityUrl="" publicRegistrationEnabled={false} />);
    expect(screen.queryByRole("link", { name: "Cộng đồng" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /đăng nhập/i })).not.toBeInTheDocument();
  });

  it("opens and closes the mobile menu", () => {
    render(<Navbar communityUrl="https://community.example.test" publicRegistrationEnabled />);
    const menu = screen.getByRole("button", { name: "Chuyển menu" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(menu).toHaveAttribute("aria-controls", "mobile-navigation");
    expect(screen.getAllByRole("link", { name: "Cộng đồng" }).length).toBeGreaterThan(1);
    fireEvent.click(menu);
    expect(screen.getAllByRole("link", { name: "Cộng đồng" })).toHaveLength(1);
  });

  it("uses contact as the fallback while registration is not published", () => {
    render(<Navbar communityUrl="" publicRegistrationEnabled={false} />);
    expect(screen.getAllByRole("link", { name: "Liên hệ" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Liên hệ" })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: expect.stringContaining("/contact") })]),
    );
    expect(screen.queryByRole("link", { name: "Đăng ký" })).not.toBeInTheDocument();
  });
});
