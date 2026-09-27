/**
 * Tests for Forum listing page (/forum)
 * - Sidebar renders all 4 categories
 * - At least 8 thread titles are rendered
 * - Each thread title is a link pointing to /forum/[slug]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
// Mock Next.js modules
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

import ForumPage from "@/app/forum/page";
import { forumThreads, forumCategories } from "../lib/forum-data";

describe("Forum Listing Page", () => {
  beforeEach(() => {
    render(<ForumPage />);
  });

  describe("Category Sidebar", () => {
    it("renders exactly 4 categories", () => {
      expect(forumCategories).toHaveLength(4);
    });

    it("renders the 'Introductions' category in the sidebar", () => {
      const sidebar = screen.getByRole("complementary");
      expect(within(sidebar).getAllByText("Introductions").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the 'Life & Growth' category in the sidebar", () => {
      const sidebar = screen.getByRole("complementary");
      expect(within(sidebar).getAllByText("Life & Growth").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the 'Relationships' category in the sidebar", () => {
      const sidebar = screen.getByRole("complementary");
      expect(within(sidebar).getAllByText("Relationships").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the 'Spirituality' category in the sidebar", () => {
      const sidebar = screen.getByRole("complementary");
      expect(within(sidebar).getAllByText("Spirituality").length).toBeGreaterThanOrEqual(1);
    });

    it("renders all 4 required categories in the sidebar", () => {
      const sidebar = screen.getByRole("complementary");
      const requiredCategories = [
        "Introductions",
        "Life & Growth",
        "Relationships",
        "Spirituality",
      ];
      requiredCategories.forEach((category) => {
        expect(within(sidebar).getAllByText(category).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Thread List", () => {
    it("renders at least 8 thread titles", () => {
      // Each thread title is a Link (rendered as <a>) with the thread text
      const links = screen.getAllByRole("link");
      // Filter links that point to /forum/ paths (thread links)
      const threadLinks = links.filter(
        (link) => link.getAttribute("href")?.startsWith("/forum/") ?? false
      );
      expect(threadLinks.length).toBeGreaterThanOrEqual(8);
    });

    it("forum-data has at least 8 thread objects", () => {
      expect(forumThreads.length).toBeGreaterThanOrEqual(8);
    });

    it("each thread in forum-data has required fields", () => {
      forumThreads.forEach((thread) => {
        expect(thread.slug).toBeTruthy();
        expect(thread.title).toBeTruthy();
        expect(thread.authorName).toBeTruthy();
        expect(thread.timestamp).toBeTruthy();
        expect(typeof thread.replyCount).toBe("number");
        expect(thread.category).toBeTruthy();
      });
    });

    it("each thread title link points to /forum/[slug]", () => {
      const links = screen.getAllByRole("link");
      const threadLinks = links.filter(
        (link) => link.getAttribute("href")?.startsWith("/forum/") ?? false
      );
      threadLinks.forEach((link) => {
        const href = link.getAttribute("href") ?? "";
        expect(href).toMatch(/^\/forum\/[^/]+$/);
      });
    });

    it("renders thread titles as anchor elements", () => {
      // Each thread title from forum-data should appear as a link
      forumThreads.slice(0, 8).forEach((thread) => {
        // Find the link element containing this thread's title text
        const linkElement = screen.getByRole("link", { name: thread.title });
        expect(linkElement).toBeInTheDocument();
        expect(linkElement.tagName).toBe("A");
      });
    });

    it("thread links point to correct /forum/[slug] paths", () => {
      forumThreads.slice(0, 8).forEach((thread) => {
        const linkElement = screen.getByRole("link", { name: thread.title });
        expect(linkElement).toHaveAttribute("href", `/forum/${thread.slug}`);
      });
    });

    it("renders Vietnamese thread titles — no Lorem ipsum text", () => {
      const pageContent = document.body.textContent ?? "";
      expect(pageContent).not.toMatch(/lorem ipsum/i);
    });

    it("renders Vietnamese author names", () => {
      // Check that at least one Vietnamese name appears
      expect(screen.getAllByText("Nguyễn Thị Mai").length).toBeGreaterThan(0);
    });
  });

  describe("Page structure", () => {
    it("renders the forum page heading", () => {
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders thread count display", () => {
      expect(screen.getByText(`${forumThreads.length} bài viết`)).toBeInTheDocument();
    });
  });
});
