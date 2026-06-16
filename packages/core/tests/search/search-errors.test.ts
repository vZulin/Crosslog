import { describe, expect, it } from "vitest";
import { createSearchQuery } from "../../src/search/search-query";
import { searchLogLines } from "../../src/search/search-engine";
import { updateSearchIndex } from "../../src/search/search-index";

describe("search errors", () => {
  it("reports invalid regex as search state instead of throwing", () => {
    const result = searchLogLines(["request started"], createSearchQuery("[request", "regex", false));

    expect(result.matches).toEqual([]);
    expect(result.currentMatchIndex).toBeNull();
    expect(result.error).toContain("Invalid regular expression");
  });

  it("clears previous errors when an active regex becomes valid", () => {
    const invalid = searchLogLines(["request started"], createSearchQuery("[request", "regex", false));

    const valid = updateSearchIndex(invalid, ["request started", "request completed"], {
      ...invalid,
      query: "request",
    });

    expect(valid.error).toBeNull();
    expect(valid.matches).toHaveLength(2);
  });
});
