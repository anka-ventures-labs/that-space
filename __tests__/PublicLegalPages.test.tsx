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

afterEach(() => {
  if (originalSupportEmail === undefined) delete process.env.PUBLIC_SUPPORT_EMAIL;
  else process.env.PUBLIC_SUPPORT_EMAIL = originalSupportEmail;
});

describe("public launch pages", () => {
  it("states that every adult is eligible and no identity document is requested", () => {
    const terms = render(<TermsPage />);
    expect(screen.getByText(/bất kỳ ai từ đủ 18 tuổi/i)).toBeInTheDocument();
    expect(screen.getByText(/không phân biệt giới tính/i)).toBeInTheDocument();
    terms.unmount();

    render(<PrivacyPage />);
    expect(screen.getByText(/không yêu cầu ảnh giấy tờ tùy thân/i)).toBeInTheDocument();
    expect(screen.getByText(/Bà Mối chưa mở/i)).toBeInTheDocument();
  });

  it("uses the configured support address for invitation requests", () => {
    process.env.PUBLIC_SUPPORT_EMAIL = "hello@example.test";
    render(<ContactPage />);
    expect(screen.getByRole("link", { name: "Gửi email cho đội ngũ" })).toHaveAttribute("href", "mailto:hello@example.test");
  });

  it("fails visibly instead of creating a circular contact link when support is absent", () => {
    delete process.env.PUBLIC_SUPPORT_EMAIL;
    render(<ContactPage />);
    expect(screen.getByText(/Kênh tiếp nhận yêu cầu đang được cấu hình/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /liên hệ qua/i })).not.toBeInTheDocument();
  });

  it("renders a Vietnamese, home-only not-found escape hatch", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Trang này không tồn tại" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
  });
});
