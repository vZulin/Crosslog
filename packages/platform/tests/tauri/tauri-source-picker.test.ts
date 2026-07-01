import { describe, expect, it, vi } from "vitest";
import { TauriSourcePicker } from "../../src/tauri/tauri-source-picker";

describe("TauriSourcePicker", () => {
  it("maps native file dialog selections into desktop file source refs", async () => {
    const openDialog = vi.fn(async () => ["/var/log/app.log", "/tmp/service.log"]);
    const picker = new TauriSourcePicker(openDialog);

    await expect(picker.pickFiles()).resolves.toEqual([
      {
        id: "desktop-file-var-log-app-log",
        name: "app.log",
        path: "/var/log/app.log",
      },
      {
        id: "desktop-file-tmp-service-log",
        name: "service.log",
        path: "/tmp/service.log",
      },
    ]);
    expect(openDialog).toHaveBeenCalledWith({ directory: false, multiple: true });
  });

  it("returns an empty file selection when the native file dialog is cancelled", async () => {
    const openDialog = vi.fn(async () => null);
    const picker = new TauriSourcePicker(openDialog);

    await expect(picker.pickFiles()).resolves.toEqual([]);
  });

  it("maps native directory dialog selection into a desktop directory source ref", async () => {
    const openDialog = vi.fn(async () => "/Users/crosslog/logs");
    const picker = new TauriSourcePicker(openDialog);

    await expect(picker.pickDirectory()).resolves.toEqual({
      id: "desktop-directory-users-crosslog-logs",
      name: "logs",
      path: "/Users/crosslog/logs",
    });
    expect(openDialog).toHaveBeenCalledWith({ directory: true, multiple: false });
  });

  it("returns null when the native directory dialog is cancelled", async () => {
    const openDialog = vi.fn(async () => null);
    const picker = new TauriSourcePicker(openDialog);

    await expect(picker.pickDirectory()).resolves.toBeNull();
  });

  it("uses the first selected path when a directory dialog returns an array", async () => {
    const openDialog = vi.fn(async () => ["C:\\logs", "C:\\ignored"]);
    const picker = new TauriSourcePicker(openDialog);

    await expect(picker.pickDirectory()).resolves.toEqual({
      id: "desktop-directory-c-logs",
      name: "logs",
      path: "C:\\logs",
    });
  });
});
