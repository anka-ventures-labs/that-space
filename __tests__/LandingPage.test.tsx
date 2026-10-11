import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    const imageProps = { ...props };
    delete imageProps.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...imageProps} />;
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
const originalCommunityLinkEnabled = process.env.PUBLIC_COMMUNITY_LINK_ENABLED;
const originalPublicRegistrationEnabled = process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED;
const originalSupportEmail = process.env.PUBLIC_SUPPORT_EMAIL;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  restoreEnv("DISCOURSE_URL", originalDiscourseUrl);
  restoreEnv("PUBLIC_COMMUNITY_LINK_ENABLED", originalCommunityLinkEnabled);
  restoreEnv("COMMUNITY_PUBLIC_REGISTRATION_ENABLED", originalPublicRegistrationEnabled);
  restoreEnv("PUBLIC_SUPPORT_EMAIL", originalSupportEmail);
});

describe("Landing Page", () => {
  it("offers direct public signup and member login", () => {
    process.env.DISCOURSE_URL = "https://community.example.test/";
    process.env.PUBLIC_COMMUNITY_LINK_ENABLED = "true";
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = "true";
    process.env.PUBLIC_SUPPORT_EMAIL = "hello@example.test";
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thật Space");
    expect(screen.getByRole("link", { name: "Tham gia Thật Space" })).toHaveAttribute("href", "https://community.example.test/signup");
    expect(screen.getByRole("link", { name: "Đăng nhập thành viên" })).toHaveAttribute("href", "https://community.example.test/login");
    expect(screen.getByText(/không cần lời mời hay chờ phê duyệt thủ công/i)).toBeInTheDocument();
  });

  it("does not emit a broken community or login link when the community URL is absent", () => {
    delete process.env.DISCOURSE_URL;
    process.env.PUBLIC_COMMUNITY_LINK_ENABLED = "true";
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = "true";
    process.env.PUBLIC_SUPPORT_EMAIL = "hello@example.test";
    render(<HomePage />);

    expect(screen.getAllByRole("link", { name: "Liên hệ Thật Space" })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: expect.stringContaining("/contact") })]),
    );
    expect(screen.queryByRole("link", { name: "Đăng nhập thành viên" })).not.toBeInTheDocument();
  });

  it("keeps public links closed unless their independent gates are configured", () => {
    process.env.DISCOURSE_URL = "https://community.example.test/";
    delete process.env.PUBLIC_COMMUNITY_LINK_ENABLED;
    delete process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED;
    delete process.env.PUBLIC_SUPPORT_EMAIL;
    render(<HomePage />);

    expect(screen.queryByRole("link", { name: "Đăng nhập thành viên" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Liên hệ Thật Space" })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: expect.stringContaining("/contact") })]),
    );
  });

  it("states open adult eligibility and presents Bà Mối as the core journey", () => {
    render(<HomePage />);
    expect(screen.getByText(/không phân biệt giới tính/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Bà Mối là nơi cuộc gặp bắt đầu/i })).toBeInTheDocument();
    expect(screen.getByText(/không tự động được dùng cho mai mối/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /quyền riêng tư/i })).toHaveAttribute("href", "/privacy");
  });
});
