import { describe, expect, it } from "vitest";
import { defaultFileOpenPolicy } from "@crosslog/core";
import { BrowserFileAccess } from "../../src/browser/browser-file-access";

describe("FileAccessPort implementations", () => {
  it("returns a typed source result for browser read-only opens", async () => {
    const access = new BrowserFileAccess();
    const result = await access.openFileReadOnly(
      { id: "file-1", name: "app.log" },
      defaultFileOpenPolicy,
    );

    expect(result.ok).toBe(true);
  });
});

