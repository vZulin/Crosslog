import { describe, expect, it } from "vitest";
import { BrowserDirectoryAccess } from "../../src/browser/browser-directory-access";

describe("browser directory access", () => {
  it("lists top-level files and ignores nested directory descriptors", async () => {
    const access = new BrowserDirectoryAccess();
    const files = await access.listTopLevelFiles({
      id: "logs",
      name: "logs",
      entries: [
        {
          kind: "file",
          id: "older",
          name: "older.log",
          createdAt: new Date("2026-06-15T10:00:00.000Z"),
          sizeBytes: 10,
        },
        {
          kind: "directory",
          id: "nested",
          name: "archive",
        },
        {
          kind: "file",
          id: "newer",
          name: "newer.log",
          createdAt: new Date("2026-06-16T10:00:00.000Z"),
          sizeBytes: 20,
        },
      ],
    });

    expect(files.map((file) => file.name)).toEqual(["newer.log", "older.log"]);
    expect(files.every((file) => file.identity.platform === "web")).toBe(true);
  });

  it("uses registered descriptors when the directory ref does not carry entries", async () => {
    const access = new BrowserDirectoryAccess(
      new Map([
        [
          "registered",
          [
            {
              kind: "file",
              id: "registered-file",
              name: "registered.log",
              sizeBytes: 1,
            },
          ],
        ],
      ]),
    );

    await expect(access.refreshDirectory({ id: "registered", name: "registered" })).resolves.toHaveLength(1);
  });
});
