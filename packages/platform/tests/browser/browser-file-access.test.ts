import { describe, expect, it } from "vitest";
import { defaultFileOpenPolicy, flattenLineChunkText } from "@crosslog/core";
import { BrowserFileAccess } from "../../src/browser/browser-file-access";

describe("browser file access", () => {
  it("opens browser File objects as read-only log sources", async () => {
    const access = new BrowserFileAccess();
    const file = new File(["first line\nsecond line"], "browser.log", {
      type: "text/plain",
    });

    const result = await access.openFileReadOnly(
      { id: "browser-file", name: "browser.log", file },
      defaultFileOpenPolicy,
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.source.displayName : null).toBe("browser.log");
    expect(result.ok ? flattenLineChunkText(result.source.lineChunks) : []).toEqual([
      "first line",
      "second line",
    ]);
  });

  it("rejects browser files before reading when the size policy fails", async () => {
    const access = new BrowserFileAccess();
    const result = await access.openFileReadOnly(
      { id: "large", name: "large.log", file: new File(["0123456789"], "large.log") },
      { maxFileSizeBytes: 4, availableMemoryBytes: null },
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error.code).toBe("FileTooLarge");
  });
});
