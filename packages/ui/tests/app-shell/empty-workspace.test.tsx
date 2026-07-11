import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendRawLinesToChunks,
  createDirectoryFileEntry,
  type Session,
  type FileSource,
} from "@crosslog/core";
import type {
  CrosslogPlatform,
  DirectorySourceRef,
  DragDropSource,
  FileSourceRef,
  NativeDropHandler,
} from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("empty workspace alignment", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("renders the shared shell, centered drop zone, and file/directory open actions on Web", async () => {
    const { container, getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);
    await settleShellEffects();

    expect(getByTestId(redesignedShellTestIds.topbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.activityRail)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.emptyWorkspace)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.emptyDropZone).getAttribute("aria-label")).toBe(
      "Drop log sources",
    );
    expect(getByRole("button", { name: "Open File" })).toBeTruthy();
    expect(getByRole("button", { name: "Open Directory" })).toBeTruthy();
    expect(container.querySelector('[data-ui-test-action="openSampleLogs"]')).toBeNull();
  });

  it("highlights drag-over state without replacing the drop-zone element", async () => {
    const { getByTestId } = render(<AppShell platform={createMockPlatform()} />);
    await settleShellEffects();
    const dropZone = getByTestId(redesignedShellTestIds.emptyDropZone);

    expect(dropZone.getAttribute("data-drag-over")).toBe("false");

    fireEvent.dragEnter(dropZone);
    expect(getByTestId(redesignedShellTestIds.emptyDropZone)).toBe(dropZone);
    expect(dropZone.getAttribute("data-drag-over")).toBe("true");

    fireEvent.dragOver(dropZone);
    expect(getByTestId(redesignedShellTestIds.emptyDropZone)).toBe(dropZone);

    fireEvent.drop(dropZone);
    expect(dropZone.getAttribute("data-drag-over")).toBe("false");
  });

  it("opens file selection from the Open File action and leaves the workspace empty on cancellation", async () => {
    const platform = createMockPlatform();
    const { getByRole, queryAllByTestId, queryByRole } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByRole("button", { name: "Open File" }));

    await waitFor(() => expect(platform.sourcePicker.pickFiles).toHaveBeenCalledTimes(1));
    expect(platform.sourcePicker.pickDirectory).not.toHaveBeenCalled();
    expect(queryAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(0);
    expect(queryByRole("heading", { name: "app.log" })).toBeNull();
  });

  it("opens directory selection from the Open Directory action and leaves the workspace empty on cancellation", async () => {
    const platform = createMockPlatform();
    const { getByRole, queryAllByTestId } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByRole("button", { name: "Open Directory" }));

    await waitFor(() => expect(platform.sourcePicker.pickDirectory).toHaveBeenCalledTimes(1));
    expect(platform.sourcePicker.pickFiles).not.toHaveBeenCalled();
    expect(queryAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(0);
  });

  it("opens a selected file without using sample panes", async () => {
    const platform = createMockPlatform({
      selectedFiles: [{ id: "selected-app", name: "selected-app.log" }],
    });
    const { getByRole, getByText, queryByRole } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByRole("button", { name: "Open File" }));

    await waitFor(() => expect(getByRole("heading", { name: "selected-app.log" })).toBeTruthy());
    expect(getByText("selected-app.log opened from selected source")).toBeTruthy();
    expect(queryByRole("heading", { name: "app.log" })).toBeNull();
    expect(platform.sourcePicker.pickDirectory).not.toHaveBeenCalled();
  });

  it("drops recovered browser session panes and reopens the web app as an empty workspace", async () => {
    const platform = createMockPlatform({
      recoveredSession: createRecoveredBrowserSession(),
    });
    const { getByTestId, queryAllByTestId, queryByRole } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    await waitFor(() => expect(platform.sessionStore.recoverSession).toHaveBeenCalledTimes(1));
    expect(getByTestId(redesignedShellTestIds.emptyWorkspace)).toBeTruthy();
    expect(queryAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(0);
    expect(queryByRole("heading", { name: "app.log" })).toBeNull();
    expect(queryByRole("heading", { name: "service.log" })).toBeNull();
    expect(queryByRole("heading", { name: "app-2026-06-15.log" })).toBeNull();
  });

  it("opens a selected directory through the Open Directory action", async () => {
    const platform = createMockPlatform({
      selectedDirectory: { id: "selected-logs", name: "selected-logs" },
    });
    const { getByTestId, getByText } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByTestId(redesignedShellTestIds.emptyOpenDirectory));

    await waitFor(() =>
      expect(getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle).textContent).toBe("selected-logs"),
    );
    expect(getByText("selected-current.log")).toBeTruthy();
    expect(platform.sourcePicker.pickFiles).not.toHaveBeenCalled();
  });

  it("opens dropped sources from the empty workspace drop zone", async () => {
    const droppedFile: DragDropSource = {
      type: "file",
      source: { id: "dropped-file", name: "dropped.log" },
    };
    const platform = createMockPlatform({ droppedSources: [droppedFile] });
    const { getByRole, getByTestId } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.drop(getByTestId(redesignedShellTestIds.emptyDropZone));

    await waitFor(() => expect(getByRole("heading", { name: "dropped.log" })).toBeTruthy());
    expect(platform.dragDropSource.mapDroppedSources).toHaveBeenCalledTimes(1);
  });

  it("opens sources delivered through the native drag-drop subscription (bug 3)", async () => {
    const handlerRef: { current: NativeDropHandler | null } = { current: null };
    const platform = createMockPlatform({ nativeDropHandlerRef: handlerRef });
    const { getByRole } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    expect(platform.dragDropSource.subscribeToNativeDrops).toHaveBeenCalledTimes(1);
    expect(handlerRef.current).not.toBeNull();

    await act(async () => {
      handlerRef.current?.([
        { type: "file", source: { id: "native-drop", name: "native-drop.log" } },
      ]);
      await Promise.resolve();
    });

    await waitFor(() => expect(getByRole("heading", { name: "native-drop.log" })).toBeTruthy());
  });
});

async function settleShellEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

interface MockPlatformOptions {
  readonly selectedFiles?: readonly FileSourceRef[];
  readonly selectedDirectory?: DirectorySourceRef | null;
  readonly droppedSources?: readonly DragDropSource[];
  readonly nativeDropHandlerRef?: { current: NativeDropHandler | null };
  readonly recoveredSession?: Session | null;
}

function createMockPlatform(options: MockPlatformOptions = {}): CrosslogPlatform {
  const selectedDirectory = options.selectedDirectory ?? null;

  return {
    kind: "web",
    capabilities: {
      canOpenFiles: true,
      canOpenDirectories: true,
      canWatchFiles: false,
      canDiscoverNewDirectoryFiles: false,
      canPersistSession: true,
      limitations: [],
    },
    fileAccess: {
      openFileReadOnly: vi.fn(async (sourceRef) => ({
        ok: true,
        source: createTestFileSource(sourceRef),
      })),
      decodeFile: vi.fn(async () => ""),
      getFileIdentity: vi.fn(async () => ""),
    },
    directoryAccess: {
      listTopLevelFiles: vi.fn(async () => [
        createDirectoryFileEntry({
          identity: { value: "selected-current", platform: "web" },
          name: "selected-current.log",
          createdAt: new Date("2026-06-16T09:00:00.000Z"),
          sizeBytes: 128,
        }),
      ]),
      refreshDirectory: vi.fn(async () => []),
    },
    dragDropSource: {
      mapDroppedSources: vi.fn(async () => options.droppedSources ?? []),
      ...(options.nativeDropHandlerRef
        ? {
            subscribeToNativeDrops: vi.fn(async (handler: NativeDropHandler) => {
              options.nativeDropHandlerRef!.current = handler;
              return () => {
                options.nativeDropHandlerRef!.current = null;
              };
            }),
          }
        : {}),
    },
    sourcePicker: {
      pickFiles: vi.fn(async () => options.selectedFiles ?? []),
      pickDirectory: vi.fn(async () => selectedDirectory),
    },
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => options.recoveredSession ?? null),
    },
  };
}

function createRecoveredBrowserSession(): Session {
  return {
    schemaVersion: 1,
    panes: [
      {
        id: "pane-app",
        sourceRef: "source-app",
        title: "app.log",
        active: true,
        width: 560,
        timeOffset: { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 },
      },
      {
        id: "pane-service",
        sourceRef: "source-service",
        title: "service.log",
        active: false,
        width: 520,
        timeOffset: { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 },
      },
      {
        id: "pane-directory",
        sourceRef: "source-directory",
        title: "app-2026-06-15.log",
        active: false,
        width: 520,
        timeOffset: { days: 0, hours: 0, minutes: 1, seconds: 0, milliseconds: 0 },
      },
    ],
    paneSizes: {
      "pane-app": 560,
      "pane-service": 520,
      "pane-directory": 520,
    },
    sources: [
      {
        kind: "file",
        id: "source-app",
        fileIdentity: { value: "browser-file-app", platform: "web" },
        displayName: "app.log",
        pathLabel: "app.log",
        sizeBytes: 120,
        encoding: "utf-8",
      },
      {
        kind: "file",
        id: "source-service",
        fileIdentity: { value: "browser-file-service", platform: "web" },
        displayName: "service.log",
        pathLabel: "service.log",
        sizeBytes: 140,
        encoding: "utf-8",
      },
      {
        kind: "directory",
        id: "source-directory",
        directoryIdentity: { value: "browser-directory-logs", platform: "web" },
        displayName: "logs/2026",
        files: [
          {
            identity: { value: "directory-file-2026-06-16", platform: "web" },
            name: "app-2026-06-16.log",
            createdAt: "2026-06-16T09:00:00.000Z",
            fallbackOrderKey: "app-2026-06-16.log",
            sizeBytes: 4096,
          },
          {
            identity: { value: "directory-file-2026-06-15", platform: "web" },
            name: "app-2026-06-15.log",
            createdAt: "2026-06-15T09:00:00.000Z",
            fallbackOrderKey: "app-2026-06-15.log",
            sizeBytes: 4096,
          },
        ],
        currentFileId: "directory-file-2026-06-15",
      },
    ],
    directorySelections: {
      "source-directory": "directory-file-2026-06-15",
    },
    synchronizationEnabled: false,
    futureExtensions: {},
  };
}

function createTestFileSource(sourceRef: FileSourceRef): FileSource {
  const lines = [
    `${sourceRef.name} opened from selected source`,
    `${sourceRef.name} second line`,
  ];

  return {
    id: sourceRef.id,
    fileIdentity: { value: sourceRef.id, platform: "web" },
    displayName: sourceRef.name,
    pathLabel: sourceRef.name,
    sizeBytes: lines.join("\n").length,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], lines),
    watchState: "unsupported",
    deleted: false,
    replaced: false,
    readError: null,
  };
}
