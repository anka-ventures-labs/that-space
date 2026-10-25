import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => <a href={href} {...props}>{children}</a>,
}));

import ForumExplorer from "@/components/ForumExplorer";
import MatchmakingGallery from "@/components/MatchmakingGallery";
import TuViExperience from "@/components/TuViExperience";

describe("origami route interactions", () => {
  it("filters and sorts the handed-off forum data", () => {
    render(<ForumExplorer actionHref="https://community.example.test/new-topic" />);
    expect(screen.getByText(/10 bài viết/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Relationships 3/i }));
    expect(screen.getByText(/3 bài viết/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /hành trình yoga/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Sắp xếp/i), { target: { value: "replies" } });
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.textContent?.includes("Những người mẹ đơn thân"))).toBe(true);
  });

  it("unfolds a chart and switches highlighted readings", async () => {
    render(<TuViExperience />);
    expect(screen.getByText(/Lá số của bạn đang gấp lại/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Ngày sinh/i), { target: { value: "1996-01-15" } });
    fireEvent.change(screen.getByLabelText(/Giờ sinh/i), { target: { value: "08:30" } });
    fireEvent.change(screen.getByLabelText(/Nơi sinh/i), { target: { value: "Hà Nội" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Reading/i }));
    expect(await screen.findByRole("heading", { name: /Your Reading/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Quan Lộc/i }));
    expect(screen.getAllByText(/Career & Purpose/i)).toHaveLength(2);
  });

  it("opens and closes the compatibility letter", () => {
    render(<MatchmakingGallery joinHref="https://community.example.test/signup" />);
    const trigger = screen.getAllByRole("button", { name: /View Compatibility/i })[0];
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Trần Minh Châu" })).toBeInTheDocument();
    const joinLink = screen.getByRole("link", { name: /Trò chuyện riêng với Bà Mối/i });
    expect(joinLink).toHaveAttribute("href", "https://community.example.test/signup");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(joinLink).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
