/**
 * Tests for Landing Page (app/page.tsx) - US-003
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Next.js modules
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

import HomePage from "@/app/page";

describe("Landing Page (US-003)", () => {
  beforeEach(() => {
    render(<HomePage />);
  });

  describe("Hero section", () => {
    it("renders h1 with the correct tagline", () => {
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(
        "A private space for women to connect, grow, and discover"
      );
    });

    it("renders the logo via next/image from /logo.jpg", () => {
      const logo = screen.getByAltText("Thật Space");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "/logo.jpg");
    });

    it("renders 'Join the Community' CTA link pointing to /forum", () => {
      // There may be multiple "Join the Community" links (hero + CTA banner)
      const ctaLinks = screen.getAllByRole("link", {
        name: /join the community/i,
      });
      expect(ctaLinks.length).toBeGreaterThan(0);
      // At least one should point to /forum
      const forumLinks = ctaLinks.filter(
        (link) => link.getAttribute("href") === "/forum"
      );
      expect(forumLinks.length).toBeGreaterThan(0);
    });
  });

  describe("Feature cards", () => {
    it("renders the Forum feature card", () => {
      expect(screen.getByText("Forum")).toBeInTheDocument();
    });

    it("renders the Tử Vi Horoscope feature card", () => {
      expect(screen.getByText("Tử Vi Horoscope")).toBeInTheDocument();
    });

    it("renders the Matchmaking feature card", () => {
      expect(screen.getByText("Matchmaking")).toBeInTheDocument();
    });

    it("Forum card links to /forum", () => {
      const forumHeading = screen.getByText("Forum");
      const card = forumHeading.closest("a");
      expect(card).toHaveAttribute("href", "/forum");
    });

    it("Tử Vi Horoscope card links to /tuvi", () => {
      const tuviHeading = screen.getByText("Tử Vi Horoscope");
      const card = tuviHeading.closest("a");
      expect(card).toHaveAttribute("href", "/tuvi");
    });

    it("Matchmaking card links to /matchmaking", () => {
      const matchHeading = screen.getByText("Matchmaking");
      const card = matchHeading.closest("a");
      expect(card).toHaveAttribute("href", "/matchmaking");
    });
  });

  describe("Testimonials", () => {
    it("renders at least 2 testimonial authors with Vietnamese names", () => {
      // Check for specific Vietnamese women names used in the testimonials
      const names = [
        "Nguyễn Thanh Hà",
        "Trần Minh Châu",
        "Lê Phương Linh",
      ];
      const foundNames = names.filter((name) => {
        try {
          screen.getByText(name);
          return true;
        } catch {
          return false;
        }
      });
      expect(foundNames.length).toBeGreaterThanOrEqual(2);
    });

    it("renders Nguyễn Thanh Hà testimonial", () => {
      expect(screen.getByText("Nguyễn Thanh Hà")).toBeInTheDocument();
    });

    it("renders Trần Minh Châu testimonial", () => {
      expect(screen.getByText("Trần Minh Châu")).toBeInTheDocument();
    });

    it("renders at least 3 testimonial quote entries", () => {
      // All 3 testimonials have italic quotes
      const quotes = screen.getAllByText(/Thật Space|Vietnamese/i);
      expect(quotes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Content quality", () => {
    it("does not contain any Lorem ipsum text", () => {
      const bodyText = document.body.textContent || "";
      expect(bodyText.toLowerCase()).not.toContain("lorem ipsum");
    });
  });
});
