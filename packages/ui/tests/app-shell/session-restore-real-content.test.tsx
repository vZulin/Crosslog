import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource, type Session } from "@crosslog/core";
import type { CrosslogPlatform, FileSourceRef } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("AppShell desktop session restore", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("reopens restored desktop files through file access instead of generating title-based content", async () => {
    const restoredLine = "2026-04-17 13:31:44,051 REAL restored idea log line";
    const platform = createDesktopPlatformWithRestoredSession({
      restoredPath: "/var/log/idea.2.log",
      restoredLines: [restoredLine],
    });

    const { container } = render(<AppShell platform={platform} />);

    await waitFor(() => {
      expect(platform.fileAccess.openFileReadOnly).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "source-idea-2",
          name: "idea.2.log",
          path: "/var/log/idea.2.log",
        }),
        expect.any(Object),
      );
    });
    await waitFor(() => expect(container.textContent).toContain(restoredLine));
    expect(container.textContent).not.toContain("2026-06-16T09:00:09.000Z idea.2.log line 10");
  });
});

function createDesktopPlatformWithRestoredSession(options: {
  readonly restoredPath: string;
  readonly restoredLines: readonly string[];
}): CrosslogPlatform {
  return {
    kind: "desktop",
    capabilities: {
      canOpenFiles: true,
      canOpenDirectories: true,
      canWatchFiles: true,
      canDiscoverNewDirectoryFiles: true,
      canPersistSession: true,
      limitations: [],
    },
    fileAccess: {
      openFileReadOnly: vi.fn(async (sourceRef: FileSourceRef) => ({
        ok: true,
        source: createRestoredFileSource(sourceRef, options.restoredLines),
      })),
      decodeFile: vi.fn(async () => ""),
      getFileIdentity: vi.fn(async () => options.restoredPath),
    },
    directoryAccess: {
      listTopLevelFiles: vi.fn(async () => []),
      refreshDirectory: vi.fn(async () => []),
    },
    dragDropSource: {
      mapDroppedSources: vi.fn(async () => []),
    },
    sourcePicker: {
      pickFiles: vi.fn(async () => []),
      pickDirectory: vi.fn(async () => null),
    },
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      recoverSession: vi.fn(async () => createRestoredSession(options.restoredPath)),
      writeSessionSnapshot: vi.fn(async () => undefined),
    },
  };
}

function createRestoredSession(path: string): Session {
  return {
    schemaVersion: 1,
    panes: [
      {
        id: "pane-idea-2",
        sourceRef: "source-idea-2",
        title: "idea.2.log",
        active: true,
        width: 520,
        timeOffset: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        },
      },
    ],
    paneSizes: { "pane-idea-2": 520 },
    sources: [
      {
        kind: "file",
        id: "source-idea-2",
        fileIdentity: { value: path, platform: "desktop" },
        displayName: "idea.2.log",
        pathLabel: path,
        sizeBytes: 128,
        encoding: "utf-8",
      },
    ],
    directorySelections: {},
    synchronizationEnabled: true,
    futureExtensions: {},
  };
}

function createRestoredFileSource(
  sourceRef: FileSourceRef,
  lines: readonly string[],
): FileSource {
  return {
    id: sourceRef.id,
    fileIdentity: { value: sourceRef.path ?? sourceRef.id, platform: "desktop" },
    displayName: sourceRef.name,
    pathLabel: sourceRef.path ?? sourceRef.name,
    sizeBytes: lines.join("\n").length,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], lines),
    watchState: "watching",
    deleted: false,
    replaced: false,
    readError: null,
  };
}
