import { describe, expect, it } from "vitest";
import { createDirectorySource, directorySourceReducer } from "../../src";

describe("empty directory source", () => {
  it("represents empty directories without navigation targets", () => {
    const source = createDirectorySource({
      id: "empty",
      directoryIdentity: { value: "empty", platform: "web" },
      displayName: "empty",
      files: [],
    });

    expect(source.currentFileId).toBeNull();
    expect(source.navigationIndex.orderedFileIds).toEqual([]);
    expect(source.navigationIndex.previousFileId).toBeNull();
    expect(source.navigationIndex.nextFileId).toBeNull();
  });

  it("returns to empty state when refresh contains no files", () => {
    const source = createDirectorySource({
      id: "empty",
      directoryIdentity: { value: "empty", platform: "web" },
      displayName: "empty",
      files: [],
    });
    const refreshed = directorySourceReducer(source, { type: "refreshFiles", files: [] });

    expect(refreshed.currentFileId).toBeNull();
    expect(refreshed.files).toEqual([]);
  });
});
