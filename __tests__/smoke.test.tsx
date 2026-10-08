/**
 * Smoke test: the public homepage renders its brand and truthful capabilities.
 *
 * Public-surface behaviour (community URL, signup vs login) is covered by
 * LandingPage.test.tsx. This file only guards what must be true regardless of
 * configuration.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) {
    const imageProps = { ...props };
    delete imageProps.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...imageProps} />;
  },
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Import the page component after mocks are set up
import HomePage from "@/app/page";

const originalDiscourseUrl = process.env.DISCOURSE_URL;

describe("Landing Page Smoke Test", () => {
  beforeEach(() => {
    delete process.env.DISCOURSE_URL;
  });

  afterEach(() => {
    process.env.DISCOURSE_URL = originalDiscourseUrl;
  });

  it("renders the Thật Space brand name as the page heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thật Space");
  });

  it("serves the brand logo", () => {
    render(<HomePage />);
    expect(screen.getByAltText("Thật Space")).toHaveAttribute("src", "/logo.jpg");
  });

  it("renders the Vietnamese tagline", () => {
    render(<HomePage />);
    expect(
      screen.getByText("Một không gian riêng tư để kết nối, chia sẻ và tìm người đồng hành."),
    ).toBeInTheDocument();
  });

  it("renders the three capability sections", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Cộng đồng riêng tư", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dành cho người từ 18 tuổi", level: 3 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Thử nghiệm có kiểm soát", level: 3 }),
    ).toBeInTheDocument();
  });

  it("keeps every visitor-facing string in Vietnamese with no placeholder copy", () => {
    const { container } = render(<HomePage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/lorem ipsum/i);
    expect(text).not.toMatch(/A private space for women/i);
    expect(text).not.toMatch(/Join the Community/i);
    expect(text).not.toMatch(/chỉ dành cho phụ nữ/i);
  });
});
