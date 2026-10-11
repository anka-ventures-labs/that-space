import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

import ContactPage from "@/app/contact/page";
import NotFound from "@/app/not-found";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

const originalSupportEmail = process.env.PUBLIC_SUPPORT_EMAIL;
const originalDiscourseUrl = process.env.DISCOURSE_URL;
const originalCommunityLinkEnabled = process.env.PUBLIC_COMMUNITY_LINK_ENABLED;
const originalPublicRegistrationEnabled = process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED;

afterEach(() => {
  if (originalSupportEmail === undefined) delete process.env.PUBLIC_SUPPORT_EMAIL;
  else process.env.PUBLIC_SUPPORT_EMAIL = originalSupportEmail;
  if (originalDiscourseUrl === undefined) delete process.env.DISCOURSE_URL;
  else process.env.DISCOURSE_URL = originalDiscourseUrl;
  if (originalCommunityLinkEnabled === undefined) delete process.env.PUBLIC_COMMUNITY_LINK_ENABLED;
  else process.env.PUBLIC_COMMUNITY_LINK_ENABLED = originalCommunityLinkEnabled;
  if (originalPublicRegistrationEnabled === undefined) delete process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED;
  else process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = originalPublicRegistrationEnabled;
});

describe("public launch pages", () => {
  it("states that every adult is eligible and no identity document is requested", () => {
    const terms = render(<TermsPage />);
    expect(screen.getByText(/bất kỳ ai từ đủ 18 tuổi/i)).toBeInTheDocument();
    expect(screen.getByText(/không phân biệt giới tính/i)).toBeInTheDocument();
    terms.unmount();

    render(<PrivacyPage />);
    expect(screen.getByText(/không yêu cầu ảnh giấy tờ tùy thân/i)).toBeInTheDocument();
    expect(screen.getByText(/Bà Mối là tính năng tự nguyện/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenRouter và Anthropic/i)).toBeInTheDocument();
  });

  it("uses the configured support address for member support", () => {
    process.env.PUBLIC_SUPPORT_EMAIL = "hello@example.test";
    render(<ContactPage />);
    expect(screen.getByRole("link", { name: "Gửi email cho đội ngũ" })).toHaveAttribute("href", "mailto:hello@example.test");
  });

  it("offers signup and login support paths when a public email is absent", () => {
    delete process.env.PUBLIC_SUPPORT_EMAIL;
    process.env.DISCOURSE_URL = "https://community.example.test";
    process.env.PUBLIC_COMMUNITY_LINK_ENABLED = "true";
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = "true";
    render(<ContactPage />);
    expect(screen.getByRole("link", { name: /đăng ký bằng Google/i })).toHaveAttribute("href", "https://community.example.test/signup");
    expect(screen.getByRole("link", { name: /đăng nhập để nhận hỗ trợ/i })).toHaveAttribute("href", "https://community.example.test/login");
  });

  it("does not promise signup from support while public registration is paused", () => {
    delete process.env.PUBLIC_SUPPORT_EMAIL;
    process.env.DISCOURSE_URL = "https://community.example.test";
    process.env.PUBLIC_COMMUNITY_LINK_ENABLED = "true";
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED = "false";
    render(<ContactPage />);
    expect(screen.getByText(/đăng ký mới đang tạm dừng/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /đăng ký bằng Google/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /đăng nhập để nhận hỗ trợ/i })).toHaveAttribute("href", "https://community.example.test/login");
  });

  it("renders a Vietnamese, home-only not-found escape hatch", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Trang này không tồn tại" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
  });
});
