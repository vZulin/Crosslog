import { describe, expect, it } from "vitest";
import {
  createDirectoryFileEntry,
  createDirectorySource,
  directorySourceReducer,
  getCurrentDirectoryFile,
} from "../../src";

describe("directory source reducer", () => {
  it("creates a source with the newest file selected", () => {
    const source = createDirectorySource({
      id: "directory",
      directoryIdentity: { value: "directory", platform: "web" },
      displayName: "logs",
      files: [entry("older", "2026-06-15"), entry("newer", "2026-06-16")],
    });

    expect(source.currentFileId).toBe("newer");
    expect(getCurrentDirectoryFile(source)?.name).toBe("2026-06-16.log");
  });

  it("navigates between files through reducer actions", () => {
    const source = createDirectorySource({
      id: "directory",
      directoryIdentity: { value: "directory", platform: "web" },
      displayName: "logs",
      files: [entry("older", "2026-06-15"), entry("newer", "2026-06-16")],
    });

    const next = directorySourceReducer(source, { type: "navigate", direction: "next" });

    expect(next.currentFileId).toBe("older");
    expect(getCurrentDirectoryFile(next)?.name).toBe("2026-06-15.log");
  });

  it("does not auto-switch when a newer file is discovered", () => {
    const source = createDirectorySource({
      id: "directory",
      directoryIdentity: { value: "directory", platform: "web" },
      displayName: "logs",
      files: [entry("current", "2026-06-16"), entry("older", "2026-06-15")],
      currentFileId: "current",
    });

    const refreshed = directorySourceReducer(source, {
      type: "refreshFiles",
      files: [entry("newer", "2026-06-17"), entry("current", "2026-06-16"), entry("older", "2026-06-15")],
    });

    expect(refreshed.currentFileId).toBe("current");
    expect(refreshed.navigationIndex.previousFileId).toBe("newer");
  });

  it("adds discovered files against the latest navigation state", () => {
    const source = createDirectorySource({
      id: "directory",
      directoryIdentity: { value: "directory", platform: "web" },
      displayName: "logs",
      files: [
        entry("current", "2026-06-16"),
        entry("selected", "2026-06-15"),
        entry("older", "2026-06-14"),
      ],
      currentFileId: "selected",
    });

    const navigated = directorySourceReducer(source, { type: "navigate", direction: "previous" });
    const refreshed = directorySourceReducer(navigated, {
      type: "addFiles",
      files: [entry("newer", "2026-06-17")],
    });

    expect(refreshed.currentFileId).toBe("current");
    expect(refreshed.navigationIndex.previousFileId).toBe("newer");
    expect(refreshed.navigationIndex.nextFileId).toBe("selected");
  });
});

function entry(id: string, day: string) {
  return createDirectoryFileEntry({
    identity: { value: id, platform: "web" },
    name: `${day}.log`,
    createdAt: new Date(`${day}T09:00:00.000Z`),
  });
}
