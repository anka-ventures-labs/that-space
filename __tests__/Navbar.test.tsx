import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    delete props.priority;
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

  it("renders the authoritative design routes", () => {
    render(<Navbar communityUrl="https://community.example.test" publicRegistrationEnabled />);
    expect(screen.getByRole("link", { name: /Thật Space — Trang chủ/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Forum" })).toHaveAttribute("href", "/forum");
    expect(screen.getByRole("link", { name: "Tử Vi" })).toHaveAttribute("href", "/tuvi");
    expect(screen.getByRole("link", { name: "Tìm Duyên" })).toHaveAttribute("href", "/matchmaking");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  });

  it("shows member login and direct public signup", () => {
    render(<Navbar communityUrl="https://community.example.test/" publicRegistrationEnabled />);
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "https://community.example.test/login");
    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "https://community.example.test/signup");
  });

  it("omits community links when no community URL is configured", () => {
    render(<Navbar communityUrl="" publicRegistrationEnabled={false} />);
    expect(screen.queryByRole("link", { name: /đăng nhập/i })).not.toBeInTheDocument();
  });

  it("opens and closes the mobile menu", () => {
    render(<Navbar communityUrl="https://community.example.test" publicRegistrationEnabled />);
    const menu = screen.getByRole("button", { name: "Chuyển menu" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(menu).toHaveAttribute("aria-controls", "mobile-navigation");
    expect(screen.getByRole("link", { name: "Forum" })).toBeInTheDocument();
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  it("uses contact as the fallback while registration is not published", () => {
    render(<Navbar communityUrl="" publicRegistrationEnabled={false} />);
    expect(screen.getAllByRole("link", { name: "Liên hệ" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Liên hệ" })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: expect.stringContaining("/contact") })]),
    );
    expect(screen.queryByRole("link", { name: "Đăng ký" })).not.toBeInTheDocument();
  });
});
