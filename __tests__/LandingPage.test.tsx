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
const originalSupportEmail = process.env.PUBLIC_SUPPORT_EMAIL;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  restoreEnv("DISCOURSE_URL", originalDiscourseUrl);
  restoreEnv("PUBLIC_COMMUNITY_LINK_ENABLED", originalCommunityLinkEnabled);
  restoreEnv("PUBLIC_SUPPORT_EMAIL", originalSupportEmail);
});

describe("Landing Page", () => {
  it("offers a controlled pilot and only links existing members to the community", () => {
    process.env.DISCOURSE_URL = "https://community.example.test/";
    process.env.PUBLIC_COMMUNITY_LINK_ENABLED = "true";
    process.env.PUBLIC_SUPPORT_EMAIL = "hello@example.test";
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thật Space");
    expect(screen.getByRole("link", { name: "Yêu cầu tham gia thử nghiệm" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "Đăng nhập thành viên" })).toHaveAttribute("href", "https://community.example.test/login");
    expect(screen.queryByRole("link", { name: /đăng ký/i })).not.toBeInTheDocument();
  });

  it("does not emit a broken community or login link when the community URL is absent", () => {
    delete process.env.DISCOURSE_URL;
    process.env.PUBLIC_COMMUNITY_LINK_ENABLED = "true";
    process.env.PUBLIC_SUPPORT_EMAIL = "hello@example.test";
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "Yêu cầu tham gia thử nghiệm" })).toHaveAttribute("href", "/contact");
    expect(screen.queryByRole("link", { name: "Đăng nhập thành viên" })).not.toBeInTheDocument();
  });

  it("keeps community links and invitation wording closed unless their independent gates are configured", () => {
    process.env.DISCOURSE_URL = "https://community.example.test/";
    delete process.env.PUBLIC_COMMUNITY_LINK_ENABLED;
    delete process.env.PUBLIC_SUPPORT_EMAIL;
    render(<HomePage />);

    expect(screen.queryByRole("link", { name: "Đăng nhập thành viên" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem trạng thái tiếp nhận" })).toHaveAttribute("href", "/contact");
    expect(screen.getByText(/đang chuẩn bị kênh tiếp nhận/i)).toBeInTheDocument();
  });

  it("states the 18+ open eligibility and the Bà Mối launch boundary", () => {
    render(<HomePage />);
    expect(screen.getByText(/không phân biệt giới tính/i)).toBeInTheDocument();
    expect(screen.getByText(/chưa mở trong đợt thử nghiệm cộng đồng đầu tiên/i)).toBeInTheDocument();
    expect(screen.getByText(/không tự động được đưa vào Bà Mối/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /quyền riêng tư/i })).toHaveAttribute("href", "/privacy");
  });
});
