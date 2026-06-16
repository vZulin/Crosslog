import { describe, expect, it } from "vitest";
import { BrowserDirectoryAccess } from "../../packages/platform/src/browser/browser-directory-access";

describe("DirectoryAccessPort contract", () => {
  it("lists only top-level files in newest-first order", async () => {
    const directoryAccess = new BrowserDirectoryAccess(
      new Map([
        [
          "logs",
          [
            { kind: "directory", id: "nested", name: "archive" },
            {
              kind: "file",
              id: "older",
              name: "app-2026-06-15.log",
              createdAt: new Date("2026-06-15T09:00:00.000Z"),
              sizeBytes: 100,
            },
            {
              kind: "file",
              id: "newer",
              name: "app-2026-06-16.log",
              createdAt: new Date("2026-06-16T09:00:00.000Z"),
              sizeBytes: 200,
            },
          ],
        ],
      ]),
    );

    const files = await directoryAccess.listTopLevelFiles({ id: "logs", name: "logs" });

    expect(files.map((file) => file.identity.value)).toEqual(["newer", "older"]);
    expect(files.map((file) => file.name)).toEqual(["app-2026-06-16.log", "app-2026-06-15.log"]);
  });

  it("returns an empty list for empty or subdirectory-only directories", async () => {
    const directoryAccess = new BrowserDirectoryAccess(
      new Map([
        [
          "empty",
          [
            { kind: "directory", id: "nested-a", name: "archive" },
            { kind: "directory", id: "nested-b", name: "old" },
          ],
        ],
      ]),
    );

    await expect(directoryAccess.refreshDirectory({ id: "empty", name: "empty" })).resolves.toEqual([]);
  });
});
