/**
 * Smoke test: verifies the landing page renders with correct branding content.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
// Mock Next.js modules that require a full Next.js environment
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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
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

describe("Landing Page Smoke Test", () => {
  it("renders Thật Space branding text", () => {
    render(<HomePage />);
    // Check that branded text is present
    const elements = screen.getAllByText(/Thật Space/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders the main tagline", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/A private space for women to connect/i)
    ).toBeInTheDocument();
  });

  it("renders the Join the Community CTA", () => {
    render(<HomePage />);
    const ctaButtons = screen.getAllByText(/Join the Community/i);
    expect(ctaButtons.length).toBeGreaterThan(0);
  });

  it("renders the three feature cards", () => {
    render(<HomePage />);
    expect(screen.getByText("Forum")).toBeInTheDocument();
    expect(screen.getByText("Tử Vi Horoscope")).toBeInTheDocument();
    expect(screen.getByText("Matchmaking")).toBeInTheDocument();
  });
});
