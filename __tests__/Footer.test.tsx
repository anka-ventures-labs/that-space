/**
 * Tests for Footer component.
 * Verifies logo image, tagline, and copyright text are rendered.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/image
jest.mock("next/image", () => ({
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

// Mock next/link
jest.mock("next/link", () => ({
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

import Footer from "@/components/Footer";

describe("Footer", () => {
  it("renders the logo image from /logo.jpg", () => {
    render(<Footer />);
    const logo = screen.getByAltText("Thật Space");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/logo.jpg");
  });

  it("renders copyright text containing © 2024 Thật Space", () => {
    render(<Footer />);
    expect(
      screen.getByText(/© 2024 Thật Space/i)
    ).toBeInTheDocument();
  });

  it("renders the platform tagline", () => {
    render(<Footer />);
    expect(
      screen.getByText(/A private space for women to connect, grow, and discover/i)
    ).toBeInTheDocument();
  });

  it("footer is wrapped in a footer element", () => {
    const { container } = render(<Footer />);
    const footerEl = container.querySelector("footer");
    expect(footerEl).toBeInTheDocument();
  });
});
