import { describe, expect, it } from "vitest";
import { createSearchQuery } from "../../src/search/search-query";
import { searchLogLines } from "../../src/search/search-engine";

describe("search engine", () => {
  it("finds text matches across all loaded lines outside the visible viewport", () => {
    const lines = Array.from({ length: 250 }, (_, index) =>
      index === 220 ? "2026-06-16 background worker completed request id=42" : `line ${index + 1}`,
    );

    const result = searchLogLines(lines, createSearchQuery("REQUEST ID=42", "text", false));

    expect(result.error).toBeNull();
    expect(result.matches).toEqual([
      {
        lineNumber: 221,
        range: { start: 39, end: 52 },
      },
    ]);
    expect(result.currentMatchIndex).toBe(0);
  });

  it("supports regex and case-sensitive matching", () => {
    const lines = [
      "GET /health status=200",
      "get /orders status=500",
      "GET /users status=503",
    ];

    const result = searchLogLines(lines, createSearchQuery("GET .+status=5\\d\\d", "regex", true));

    expect(result.matches).toEqual([
      {
        lineNumber: 3,
        range: { start: 0, end: 21 },
      },
    ]);
  });

  it("returns every non-overlapping match in line order", () => {
    const result = searchLogLines(["error error", "ok", "error"], createSearchQuery("error", "text", true));

    expect(result.matches.map((match) => [match.lineNumber, match.range.start, match.range.end])).toEqual([
      [1, 0, 5],
      [1, 6, 11],
      [3, 0, 5],
    ]);
  });
});
