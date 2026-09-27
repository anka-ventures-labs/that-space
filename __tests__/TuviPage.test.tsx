import { render, screen } from "@testing-library/react";
import TuViPage from "../src/app/tuvi/page";

describe("TuViPage", () => {
  beforeEach(() => {
    render(<TuViPage />);
  });

  it("renders h1 with 'Tử Vi'", () => {
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("Tử Vi");
  });

  it("h1 contains the full title 'Tử Vi — Lá Số Tử Vi'", () => {
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Tử Vi — Lá Số Tử Vi");
  });

  it("form contains a name text input", () => {
    const nameInput = screen.getByRole("textbox", { name: /name/i });
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("type", "text");
  });

  it("form contains a date of birth input", () => {
    const dobInput = screen.getByLabelText(/date of birth/i);
    expect(dobInput).toBeInTheDocument();
    expect(dobInput).toHaveAttribute("type", "date");
  });

  it("form contains a time of birth input", () => {
    const tobInput = screen.getByLabelText(/time of birth/i);
    expect(tobInput).toBeInTheDocument();
    expect(tobInput).toHaveAttribute("type", "time");
  });

  it("form contains a place of birth input", () => {
    const pobInput = screen.getByLabelText(/place of birth/i);
    expect(pobInput).toBeInTheDocument();
    expect(pobInput).toHaveAttribute("type", "text");
  });

  it("renders a 'Generate Reading' button", () => {
    const btn = screen.getByRole("button", { name: /generate reading/i });
    expect(btn).toBeInTheDocument();
  });

  it("renders the reading result card with 'Your Reading' section title", () => {
    expect(screen.getByText("Your Reading")).toBeInTheDocument();
  });

  it("reading result card has 'Love & Relationships' subsection", () => {
    const el = screen.getByText(/love & relationships/i);
    expect(el).toBeInTheDocument();
  });

  it("reading result card has 'Career & Purpose' subsection", () => {
    const el = screen.getByText(/career & purpose/i);
    expect(el).toBeInTheDocument();
  });

  it("reading result card has 'Spiritual Outlook' subsection", () => {
    const el = screen.getByText(/spiritual outlook/i);
    expect(el).toBeInTheDocument();
  });

  it("renders a 'Download PDF Report' button", () => {
    const btn = screen.getByRole("button", { name: /download pdf report/i });
    expect(btn).toBeInTheDocument();
  });

  it("does not contain 'Lorem ipsum' text", () => {
    expect(document.body.textContent).not.toMatch(/lorem ipsum/i);
  });

  it("renders an intro paragraph explaining Tử Vi", () => {
    // Should have some intro text about it being Vietnamese / birth time / etc.
    const intro = document.body.textContent ?? "";
    expect(intro).toMatch(/ngày giờ sinh|birth time|chiêm tinh/i);
  });
});
