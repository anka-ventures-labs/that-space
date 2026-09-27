/**
 * Tests for Forum thread detail page (/forum/[slug])
 * - Given a valid slug, renders the thread title as h1
 * - Renders at least 3 reply cards
 * - Renders the reply textarea
 * - Breadcrumb / back link pointing to /forum is present
 * - generateStaticParams returns all slugs from forum-data
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

import ThreadPage, { generateStaticParams } from "@/app/forum/[slug]/page";
import { forumThreads } from "../lib/forum-data";

// Use the first thread as the primary test fixture
const firstThread = forumThreads[0];

describe("Forum Thread Detail Page", () => {
  describe("with a valid slug", () => {
    beforeEach(() => {
      render(<ThreadPage params={{ slug: firstThread.slug }} />);
    });

    it("renders the thread title as an h1", () => {
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(firstThread.title);
    });

    it("renders at least 3 reply cards", () => {
      const replyCards = screen.getAllByTestId("reply-card");
      expect(replyCards.length).toBeGreaterThanOrEqual(3);
    });

    it("renders the reply textarea", () => {
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("renders the 'Post Reply' button", () => {
      expect(screen.getByText("Đăng phản hồi")).toBeInTheDocument();
    });

    it("renders a breadcrumb link to /forum", () => {
      const forumLinks = screen.getAllByRole("link", { name: /forum/i });
      const backToForum = forumLinks.find(
        (link) => link.getAttribute("href") === "/forum"
      );
      expect(backToForum).toBeInTheDocument();
    });

    it("renders a back link pointing to /forum", () => {
      const links = screen.getAllByRole("link");
      const forumLinks = links.filter(
        (link) => link.getAttribute("href") === "/forum"
      );
      expect(forumLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("renders each reply author name", () => {
      firstThread.replies.forEach((reply) => {
        expect(screen.getAllByText(reply.authorName).length).toBeGreaterThanOrEqual(1);
      });
    });

    it("renders each reply body text", () => {
      firstThread.replies.forEach((reply) => {
        expect(screen.getByText(reply.body)).toBeInTheDocument();
      });
    });

    it("renders the original post body", () => {
      expect(screen.getByText(firstThread.body)).toBeInTheDocument();
    });

    it("renders the thread category in the breadcrumb", () => {
      expect(
        screen.getAllByText(firstThread.category).length
      ).toBeGreaterThanOrEqual(1);
    });

    it("contains no Lorem ipsum text", () => {
      expect(document.body.textContent).not.toMatch(/lorem ipsum/i);
    });
  });

  describe("forum-data structure", () => {
    it("every thread has a body field", () => {
      forumThreads.forEach((thread) => {
        expect(thread.body).toBeTruthy();
        expect(typeof thread.body).toBe("string");
        expect(thread.body.length).toBeGreaterThan(0);
      });
    });

    it("every thread has a replies array with at least 3 entries", () => {
      forumThreads.forEach((thread) => {
        expect(Array.isArray(thread.replies)).toBe(true);
        expect(thread.replies.length).toBeGreaterThanOrEqual(3);
      });
    });

    it("every reply has authorName, timestamp, and body fields", () => {
      forumThreads.forEach((thread) => {
        thread.replies.forEach((reply) => {
          expect(reply.authorName).toBeTruthy();
          expect(reply.timestamp).toBeTruthy();
          expect(reply.body).toBeTruthy();
        });
      });
    });

    it("no thread body contains Lorem ipsum", () => {
      forumThreads.forEach((thread) => {
        expect(thread.body).not.toMatch(/lorem ipsum/i);
        thread.replies.forEach((reply) => {
          expect(reply.body).not.toMatch(/lorem ipsum/i);
        });
      });
    });
  });

  describe("generateStaticParams", () => {
    it("returns an array of slug objects", () => {
      const params = generateStaticParams();
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBeGreaterThan(0);
      params.forEach((p) => {
        expect(typeof p.slug).toBe("string");
        expect(p.slug.length).toBeGreaterThan(0);
      });
    });

    it("includes all slugs from forum-data", () => {
      const params = generateStaticParams();
      const returnedSlugs = params.map((p) => p.slug);
      forumThreads.forEach((thread) => {
        expect(returnedSlugs).toContain(thread.slug);
      });
    });

    it("returns the same count as forum-data threads", () => {
      const params = generateStaticParams();
      expect(params.length).toBe(forumThreads.length);
    });
  });

  describe("with a different valid slug", () => {
    it("renders the correct title for any valid slug", () => {
      const thread = forumThreads[4]; // vuot-qua-chia-tay
      const { unmount } = render(<ThreadPage params={{ slug: thread.slug }} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(thread.title);
      unmount();
    });
  });
});
