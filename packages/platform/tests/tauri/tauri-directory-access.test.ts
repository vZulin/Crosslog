import { describe, expect, it, vi } from "vitest";
import { TauriDirectoryAccess } from "../../src/tauri/tauri-directory-access";

describe("TauriDirectoryAccess", () => {
  it("reads synthetic dropped directory entries without invoking native commands", async () => {
    const commandInvoker = vi.fn(async () => []);
    const directoryAccess = new TauriDirectoryAccess(commandInvoker);

    await expect(
      directoryAccess.listTopLevelFiles({
        id: "dropped-directory",
        name: "logs",
        entries: [
          {
            kind: "file",
            id: "dropped-app",
            name: "app.log",
            createdAt: new Date("2026-06-16T09:00:00.000Z"),
            sizeBytes: 100,
          },
        ],
      }),
    ).resolves.toMatchObject([
      {
        identity: { value: "dropped-app", platform: "desktop" },
        name: "app.log",
        sizeBytes: 100,
      },
    ]);
    expect(commandInvoker).not.toHaveBeenCalled();
  });
});
