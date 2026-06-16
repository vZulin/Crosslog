import { bench, describe } from "vitest";
import { searchLogLines } from "../../packages/core/src/search/search-engine";
import { createSearchQuery } from "../../packages/core/src/search/search-query";

describe("20 MB search", () => {
  bench("searches loaded 20 MB log content", () => {
    const lines = Array.from({ length: 250_000 }, (_, index) =>
      index === 249_999 ? "target line token=needle status=complete" : `ordinary log line ${index}`,
    );

    const result = searchLogLines(lines, createSearchQuery("token=needle", "text", true));

    if (result.matches.length !== 1 || result.matches[0]?.lineNumber !== 250_000) {
      throw new Error("Search benchmark produced an invalid result.");
    }
  });
});
