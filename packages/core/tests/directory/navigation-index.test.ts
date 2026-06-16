import { describe, expect, it } from "vitest";
import {
  createDirectoryFileEntry,
  createNavigationIndex,
  moveNavigation,
  refreshNavigationIndex,
} from "../../src";

describe("navigation index", () => {
  it("selects the newest file by default and exposes adjacent files", () => {
    const index = createNavigationIndex([
      file("old", "app-2026-06-14.log", "2026-06-14T09:00:00.000Z"),
      file("new", "app-2026-06-16.log", "2026-06-16T09:00:00.000Z"),
      file("middle", "app-2026-06-15.log", "2026-06-15T09:00:00.000Z"),
    ]);

    expect(index.orderedFileIds).toEqual(["new", "middle", "old"]);
    expect(index.currentFileId).toBe("new");
    expect(index.previousFileId).toBeNull();
    expect(index.nextFileId).toBe("middle");
  });

  it("moves through the ordered files without crossing boundaries", () => {
    const index = createNavigationIndex([
      file("new", "app-2026-06-16.log", "2026-06-16T09:00:00.000Z"),
      file("old", "app-2026-06-15.log", "2026-06-15T09:00:00.000Z"),
    ]);

    const older = moveNavigation(index, "next");
    const boundary = moveNavigation(index, "previous");

    expect(older.currentFileId).toBe("old");
    expect(older.previousFileId).toBe("new");
    expect(older.nextFileId).toBeNull();
    expect(boundary).toBe(index);
  });

  it("keeps the current file when a newer file appears", () => {
    const refreshed = refreshNavigationIndex(
      [
        file("newer", "app-2026-06-17.log", "2026-06-17T09:00:00.000Z"),
        file("current", "app-2026-06-16.log", "2026-06-16T09:00:00.000Z"),
        file("older", "app-2026-06-15.log", "2026-06-15T09:00:00.000Z"),
      ],
      "current",
    );

    expect(refreshed.currentFileId).toBe("current");
    expect(refreshed.previousFileId).toBe("newer");
    expect(refreshed.nextFileId).toBe("older");
  });
});

function file(id: string, name: string, createdAt: string) {
  return createDirectoryFileEntry({
    identity: { value: id, platform: "web" },
    name,
    createdAt: new Date(createdAt),
    sizeBytes: 1024,
  });
}
