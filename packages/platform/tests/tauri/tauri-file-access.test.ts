import { describe, expect, it, vi } from "vitest";
import { defaultFileOpenPolicy, flattenLineChunkText } from "@crosslog/core";
import { TauriFileAccess } from "../../src/tauri/tauri-file-access";

describe("TauriFileAccess", () => {
  it("reads real file content for a picked/dropped source with a path", async () => {
    const readLogFile = vi.fn(async () => ({
      displayName: "app.log",
      sizeBytes: 42,
      lines: ["first line", "second line"],
    }));
    const access = new TauriFileAccess(readLogFile);

    const result = await access.openFileReadOnly(
      { id: "desktop-file-var-log-app-log", name: "app.log", path: "/var/log/app.log" },
      defaultFileOpenPolicy,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(flattenLineChunkText(result.source.lineChunks)).toEqual(["first line", "second line"]);
      expect(result.source.sizeBytes).toBe(42);
      expect(result.source.pathLabel).toBe("/var/log/app.log");
      expect(result.source.readError).toBeNull();
    }
    expect(readLogFile).toHaveBeenCalledWith("/var/log/app.log");
  });

  it("returns an empty source when the ref carries no filesystem path", async () => {
    const readLogFile = vi.fn();
    const access = new TauriFileAccess(readLogFile);

    const result = await access.openFileReadOnly({ id: "restored", name: "app.log" }, defaultFileOpenPolicy);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(flattenLineChunkText(result.source.lineChunks)).toEqual([]);
    }
    expect(readLogFile).not.toHaveBeenCalled();
  });

  it("surfaces a read error without failing the open", async () => {
    const access = new TauriFileAccess(async () => {
      throw new Error("permission denied");
    });

    const result = await access.openFileReadOnly(
      { id: "desktop-file", name: "app.log", path: "/root/app.log" },
      defaultFileOpenPolicy,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source.readError).toBe("permission denied");
      expect(result.source.watchState).toBe("failed");
    }
  });

  it("rejects files that exceed the open policy", async () => {
    const access = new TauriFileAccess(async () => ({
      displayName: "huge.log",
      sizeBytes: Number.MAX_SAFE_INTEGER,
      lines: [],
    }));

    const result = await access.openFileReadOnly(
      { id: "desktop-file", name: "huge.log", path: "/var/log/huge.log" },
      defaultFileOpenPolicy,
    );

    expect(result.ok).toBe(false);
  });
});
