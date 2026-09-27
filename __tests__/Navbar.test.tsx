/**
 * Tests for Navbar component.
 * Verifies nav links, logo, hamburger button, sticky positioning, and active link logic.
 */
import { render, screen, fireEvent } from "@testing-library/react";
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

// Mock usePathname — default to "/" (home, no active nav link)
const mockUsePathname = jest.fn(() => "/");
jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import Navbar from "@/components/Navbar";

describe("Navbar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders logo image from /logo.jpg", () => {
    render(<Navbar />);
    const logo = screen.getAllByAltText("Thật Space");
    expect(logo.length).toBeGreaterThan(0);
    expect(logo[0]).toHaveAttribute("src", "/logo.jpg");
  });

  it("renders all four nav links", () => {
    render(<Navbar />);
    expect(screen.getAllByText("Forum").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tử Vi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Matchmaking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Profile").length).toBeGreaterThan(0);
  });

  it("has a hamburger button with aria-label", () => {
    render(<Navbar />);
    const hamburger = screen.getByRole("button", { name: /toggle menu/i });
    expect(hamburger).toBeInTheDocument();
  });

  it("navbar has sticky top-0 class for sticky positioning", () => {
    render(<Navbar />);
    const nav = screen.getByRole("navigation");
    expect(nav.className).toMatch(/sticky/);
    expect(nav.className).toMatch(/top-0/);
  });

  it("applies active class to Forum link when on /forum", () => {
    mockUsePathname.mockReturnValue("/forum");
    render(<Navbar />);
    // All "Forum" links — find the desktop one (the <a> with href /forum)
    const forumLinks = screen.getAllByRole("link", { name: "Forum" });
    expect(forumLinks.length).toBeGreaterThan(0);
    // At least one forum link should have the active style (space before means NOT hover:border-b-2)
    const activeLink = forumLinks.find((el) =>
      el.className.includes(" border-b-2 border-[#C4A882]")
    );
    expect(activeLink).toBeDefined();
  });

  it("non-active links do not have active border class", () => {
    mockUsePathname.mockReturnValue("/forum");
    render(<Navbar />);
    const profileLinks = screen.getAllByRole("link", { name: "Profile" });
    // Active class has " border-b-2 border-[#C4A882]" (space before means NOT hover:border-b-2).
    // Inactive links have "hover:border-b-2" which does NOT include " border-b-2 border-[#C4A882]".
    const hasActive = profileLinks.some((el) =>
      el.className.includes(" border-b-2 border-[#C4A882]")
    );
    expect(hasActive).toBe(false);
  });

  it("hamburger button toggles mobile menu visibility", () => {
    render(<Navbar />);
    const hamburger = screen.getByRole("button", { name: /toggle menu/i });
    // Initially the mobile menu links are not visible
    const allLinks = screen.getAllByRole("link", { name: "Forum" });
    // There should only be 1 instance (desktop); mobile menu is hidden
    expect(allLinks.length).toBe(1);

    // Click hamburger to open
    fireEvent.click(hamburger);
    // Now mobile menu should show — more "Forum" links
    const allLinksAfter = screen.getAllByRole("link", { name: "Forum" });
    expect(allLinksAfter.length).toBeGreaterThan(1);
  });

  it("mobile menu closes when a link is clicked", () => {
    render(<Navbar />);
    const hamburger = screen.getByRole("button", { name: /toggle menu/i });

    // Open menu
    fireEvent.click(hamburger);
    const mobileLinks = screen.getAllByRole("link", { name: "Forum" });
    expect(mobileLinks.length).toBeGreaterThan(1);

    // Click the last "Forum" link (mobile version)
    fireEvent.click(mobileLinks[mobileLinks.length - 1]);

    // Menu should close — back to 1 Forum link
    const linksAfterClose = screen.getAllByRole("link", { name: "Forum" });
    expect(linksAfterClose.length).toBe(1);
  });
});
