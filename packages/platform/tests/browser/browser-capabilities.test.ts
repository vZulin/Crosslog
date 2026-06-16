import { describe, expect, it } from "vitest";
import { createBrowserCapabilities } from "../../src/browser/browser-capabilities";

describe("browser capabilities", () => {
  it("reports supported browser source and session features", () => {
    const capabilities = createBrowserCapabilities({
      canOpenDirectories: true,
    });

    expect(capabilities).toMatchObject({
      canOpenFiles: true,
      canOpenDirectories: true,
      canWatchFiles: false,
      canDiscoverNewDirectoryFiles: false,
      canPersistSession: true,
    });
  });

  it("describes unsupported browser monitoring instead of promising it", () => {
    const capabilities = createBrowserCapabilities({
      canOpenDirectories: false,
    });

    expect(capabilities.limitations.map((limitation) => limitation.capability)).toEqual([
      "local-monitoring",
      "directory-picker",
    ]);
  });
});
