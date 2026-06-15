import { describe, expect, it } from "vitest";
import { defaultFileOpenPolicy } from "@crosslog/core";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "@crosslog/ui";

describe("workspace imports", () => {
  it("imports all shared package entrypoints", () => {
    const platform: CrosslogPlatform = {
      kind: "web",
      capabilities: {
        canOpenFiles: true,
        canOpenDirectories: false,
        canWatchFiles: false,
        canDiscoverNewDirectoryFiles: false,
        canPersistSession: true,
        limitations: [],
      },
    };

    expect(defaultFileOpenPolicy.maxFileSizeBytes).toBe(20 * 1024 * 1024);
    expect(AppShell).toBeTypeOf("function");
    expect(platform.kind).toBe("web");
  });
});

