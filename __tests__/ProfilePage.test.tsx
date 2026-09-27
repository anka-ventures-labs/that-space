import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";

// Mock next/link
vi.mock("next/link", () => {
  return { default: function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  } };
});

describe("ProfilePage", () => {
  it("renders member name heading", () => {
    render(<ProfilePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Nguyễn Thị Lan/i })
    ).toBeInTheDocument();
  });

  it("renders My Readings section heading", () => {
    render(<ProfilePage />);
    expect(
      screen.getByRole("heading", { name: /My Readings/i })
    ).toBeInTheDocument();
  });

  it("renders exactly 2 reading entries", () => {
    render(<ProfilePage />);
    // Reading entries link to /tuvi
    const tuviLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/tuvi");
    // 2 reading cards + 1 "New Reading" link = 3, but we check reading card-specific links
    // Reading titles distinguish them
    expect(
      screen.getByText(/Tháng 1 — Tử Vi Reading/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tháng 11 — Tử Vi Reading/i)
    ).toBeInTheDocument();
  });

  it("renders exactly 2 items (links) in My Readings section", () => {
    render(<ProfilePage />);
    // Both reading cards are <Link href="/tuvi"> elements
    // Filter links going to /tuvi — 2 reading cards + 1 "New Reading" button = 3 total
    const allLinks = screen.getAllByRole("link");
    const readingCardLinks = allLinks.filter(
      (link) =>
        link.getAttribute("href") === "/tuvi" &&
        link.textContent?.includes("Tử Vi Reading")
    );
    expect(readingCardLinks).toHaveLength(2);
  });

  it("renders My Matches section heading", () => {
    render(<ProfilePage />);
    expect(
      screen.getByRole("heading", { name: /My Matches/i })
    ).toBeInTheDocument();
  });

  it("renders exactly 3 match cards", () => {
    render(<ProfilePage />);
    const viewMatchButtons = screen.getAllByRole("link", { name: /View Match/i });
    expect(viewMatchButtons).toHaveLength(3);
  });

  it("renders 3 match cards with View Match link navigating to /matchmaking", () => {
    render(<ProfilePage />);
    const viewMatchLinks = screen.getAllByRole("link", { name: /View Match/i });
    expect(viewMatchLinks).toHaveLength(3);
    viewMatchLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/matchmaking");
    });
  });

  it("renders match names", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Trần Minh Châu")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Bảo Anh")).toBeInTheDocument();
    expect(screen.getByText("Võ Thanh Thảo")).toBeInTheDocument();
  });

  it("renders match star signs", () => {
    render(<ProfilePage />);
    expect(screen.getByText("♈ Aries")).toBeInTheDocument();
    expect(screen.getByText("♎ Libra")).toBeInTheDocument();
    expect(screen.getByText("♉ Taurus")).toBeInTheDocument();
  });

  it("does not contain Lorem ipsum text", () => {
    render(<ProfilePage />);
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
  });

  it("renders member star sign and join date", () => {
    render(<ProfilePage />);
    // getAllByText to handle multiple occurrences (sign in header + possibly in reading excerpt)
    const songNguElements = screen.getAllByText(/Song Ngư/i);
    expect(songNguElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Gia nhập/i)).toBeInTheDocument();
  });

  it("reading cards link to /tuvi", () => {
    render(<ProfilePage />);
    const allLinks = screen.getAllByRole("link");
    const tuviLinks = allLinks.filter(
      (link) => link.getAttribute("href") === "/tuvi"
    );
    // At least 2 reading card links go to /tuvi
    expect(tuviLinks.length).toBeGreaterThanOrEqual(2);
  });
});
