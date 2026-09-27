/**
 * US-009 Integration Tests
 * Verifies:
 * 1. All 5 route path components can be imported without error
 * 2. lib/forum-data.ts exports >= 8 threads
 * 3. lib/matchmaking-data.ts exports exactly 6 profiles
 */

import { describe, it, expect } from "vitest";
// Import the data modules directly from their paths
import { forumThreads, forumCategories } from "../lib/forum-data";
import { matchmakingProfiles } from "../lib/matchmaking-data";

// Import the 5 main route page components
import HomePage from "@/app/page";
import ForumPage from "@/app/forum/page";
import TuviPage from "@/app/tuvi/page";
import MatchmakingPage from "@/app/matchmaking/page";
import ProfilePage from "@/app/profile/page";

// Optionally import forum thread detail (dynamic route)
import ForumThreadPage from "@/app/forum/[slug]/page";

describe("Integration: route page components can be imported", () => {
  it("HomePage is importable and is a function", () => {
    expect(HomePage).toBeDefined();
    expect(typeof HomePage).toBe("function");
  });

  it("ForumPage is importable and is a function", () => {
    expect(ForumPage).toBeDefined();
    expect(typeof ForumPage).toBe("function");
  });

  it("TuviPage is importable and is a function", () => {
    expect(TuviPage).toBeDefined();
    expect(typeof TuviPage).toBe("function");
  });

  it("MatchmakingPage is importable and is a function", () => {
    expect(MatchmakingPage).toBeDefined();
    expect(typeof MatchmakingPage).toBe("function");
  });

  it("ProfilePage is importable and is a function", () => {
    expect(ProfilePage).toBeDefined();
    expect(typeof ProfilePage).toBe("function");
  });

  it("ForumThreadPage (dynamic route) is importable and is a function", () => {
    expect(ForumThreadPage).toBeDefined();
    expect(typeof ForumThreadPage).toBe("function");
  });
});

describe("Integration: forum-data.ts exports", () => {
  it("exports at least 8 threads", () => {
    expect(Array.isArray(forumThreads)).toBe(true);
    expect(forumThreads.length).toBeGreaterThanOrEqual(8);
  });

  it("each thread has required fields: id, slug, title, authorName, timestamp, replyCount, category, body, replies", () => {
    forumThreads.forEach((thread) => {
      expect(thread).toHaveProperty("id");
      expect(thread).toHaveProperty("slug");
      expect(thread).toHaveProperty("title");
      expect(thread).toHaveProperty("authorName");
      expect(thread).toHaveProperty("timestamp");
      expect(thread).toHaveProperty("replyCount");
      expect(thread).toHaveProperty("category");
      expect(thread).toHaveProperty("body");
      expect(Array.isArray(thread.replies)).toBe(true);
    });
  });

  it("exports forumCategories as a non-empty array", () => {
    expect(Array.isArray(forumCategories)).toBe(true);
    expect(forumCategories.length).toBeGreaterThan(0);
  });

  it("no thread title contains 'Lorem ipsum'", () => {
    forumThreads.forEach((thread) => {
      expect(thread.title).not.toMatch(/lorem ipsum/i);
      expect(thread.body).not.toMatch(/lorem ipsum/i);
    });
  });
});

describe("Integration: matchmaking-data.ts exports", () => {
  it("exports exactly 6 profiles", () => {
    expect(Array.isArray(matchmakingProfiles)).toBe(true);
    expect(matchmakingProfiles.length).toBe(6);
  });

  it("each profile has required fields: id, name, initials, avatarColor, sign, bio, compatibility", () => {
    matchmakingProfiles.forEach((profile) => {
      expect(profile).toHaveProperty("id");
      expect(profile).toHaveProperty("name");
      expect(profile).toHaveProperty("initials");
      expect(profile).toHaveProperty("avatarColor");
      expect(profile).toHaveProperty("sign");
      expect(profile).toHaveProperty("bio");
      expect(profile).toHaveProperty("compatibility");
    });
  });

  it("each profile compatibility has score, details, and description", () => {
    matchmakingProfiles.forEach((profile) => {
      expect(profile.compatibility).toHaveProperty("score");
      expect(Array.isArray(profile.compatibility.details)).toBe(true);
      expect(profile.compatibility.details.length).toBeGreaterThan(0);
      expect(profile.compatibility).toHaveProperty("description");
    });
  });

  it("all 6 profiles have unique ids", () => {
    const ids = matchmakingProfiles.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
  });
});
