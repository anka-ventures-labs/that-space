import { render, screen, fireEvent } from "@testing-library/react";
import MatchmakingPage from "../src/app/matchmaking/page";
import { matchmakingProfiles } from "../lib/matchmaking-data";

describe("MatchmakingPage", () => {
  beforeEach(() => {
    render(<MatchmakingPage />);
  });

  it("renders h1 with 'Tìm Duyên — Spiritual Matchmaking'", () => {
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("Tìm Duyên — Spiritual Matchmaking");
  });

  it("renders exactly 6 profile cards", () => {
    const buttons = screen.getAllByRole("button", { name: /view compatibility/i });
    expect(buttons).toHaveLength(6);
  });

  it("renders 6 profile names", () => {
    matchmakingProfiles.forEach((profile) => {
      expect(screen.getByText(profile.name)).toBeInTheDocument();
    });
  });

  it("each profile card has a 'View Compatibility' button", () => {
    const buttons = screen.getAllByText("View Compatibility");
    expect(buttons).toHaveLength(6);
    buttons.forEach((btn) => {
      expect(btn.tagName.toLowerCase()).toBe("button");
    });
  });

  it("renders each profile's star sign", () => {
    matchmakingProfiles.forEach((profile) => {
      expect(screen.getByText(profile.sign)).toBeInTheDocument();
    });
  });

  it("modal is not shown initially", () => {
    expect(screen.queryByText(/compatible/i)).not.toBeInTheDocument();
  });

  it("clicking first card's 'View Compatibility' button shows the modal", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);
    // Modal with score should appear
    expect(screen.getByText(/compatible/i)).toBeInTheDocument();
  });

  it("modal shows the match percentage score for the first profile", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);
    const firstProfile = matchmakingProfiles[0];
    expect(screen.getByText(`${firstProfile.compatibility.score}% Compatible`)).toBeInTheDocument();
  });

  it("modal contains a Love star rating row", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);
    expect(screen.getByText("Love")).toBeInTheDocument();
  });

  it("modal contains a Communication star rating row", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);
    expect(screen.getByText("Communication")).toBeInTheDocument();
  });

  it("modal contains a Spirituality star rating row", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);
    expect(screen.getByText("Spirituality")).toBeInTheDocument();
  });

  it("modal has a Close button", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("clicking Close button dismisses the modal", () => {
    const buttons = screen.getAllByText("View Compatibility");
    fireEvent.click(buttons[0]);

    // Modal is open
    expect(screen.getByText(/compatible/i)).toBeInTheDocument();

    // Close it
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    // Modal should be gone
    expect(screen.queryByText(/compatible/i)).not.toBeInTheDocument();
  });

  it("each profile can open its own modal with its own score", () => {
    matchmakingProfiles.forEach((profile, idx) => {
      const { unmount } = render(<MatchmakingPage />);
      const buttons = screen.getAllByText("View Compatibility");
      fireEvent.click(buttons[idx]);
      expect(
        screen.getByText(`${profile.compatibility.score}% Compatible`)
      ).toBeInTheDocument();
      unmount();
    });
  });
});

describe("matchmakingProfiles data", () => {
  it("exports exactly 6 profiles", () => {
    expect(matchmakingProfiles).toHaveLength(6);
  });

  it("every profile has required fields", () => {
    matchmakingProfiles.forEach((profile) => {
      expect(profile.id).toBeDefined();
      expect(profile.name).toBeTruthy();
      expect(profile.initials).toBeTruthy();
      expect(profile.avatarColor).toBeTruthy();
      expect(profile.sign).toBeTruthy();
      expect(profile.bio).toBeTruthy();
      expect(profile.compatibility).toBeDefined();
      expect(profile.compatibility.score).toBeGreaterThan(0);
      expect(profile.compatibility.score).toBeLessThanOrEqual(100);
      expect(profile.compatibility.details.length).toBeGreaterThanOrEqual(3);
      expect(profile.compatibility.description).toBeTruthy();
    });
  });

  it("every profile has Love, Communication, and Spirituality compatibility details", () => {
    matchmakingProfiles.forEach((profile) => {
      const labels = profile.compatibility.details.map((d) => d.label);
      expect(labels).toContain("Love");
      expect(labels).toContain("Communication");
      expect(labels).toContain("Spirituality");
    });
  });

  it("all profiles have unique ids", () => {
    const ids = matchmakingProfiles.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
  });
});
