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

  it("renders the authoritative handoff hero", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/A private space to connect, grow, and discover/i);
  });

  it("renders the interactive origami lotus control", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: /hoa sen origami/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the truthful Vietnamese eligibility copy", () => {
    render(<HomePage />);
    expect(screen.getByText(/Bất kỳ ai từ đủ 18 tuổi/i)).toBeInTheDocument();
  });

  it("renders the three capability sections", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Forum", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tử Vi Horoscope", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Matchmaking", level: 3 }),
    ).toBeInTheDocument();
  });

  it("keeps launch copy inclusive and free of placeholder text", () => {
    const { container } = render(<HomePage />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/lorem ipsum/i);
    expect(text).not.toMatch(/A private space for women/i);
    expect(text).not.toMatch(/chỉ dành cho phụ nữ/i);
    expect(text).toMatch(/không phân biệt giới tính/i);
  });
});
