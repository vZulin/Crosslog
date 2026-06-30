import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendRawLinesToChunks,
  createDirectoryFileEntry,
  type FileSource,
} from "@crosslog/core";
import type {
  CrosslogPlatform,
  DirectorySourceRef,
  DragDropSource,
  FileSourceRef,
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

  it("renders the shared shell, centered drop zone, and Open Source action", async () => {
    const { container, getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);
    await settleShellEffects();

    expect(getByTestId(redesignedShellTestIds.topbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.activityRail)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.emptyWorkspace)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.emptyDropZone).getAttribute("aria-label")).toBe(
      "Drop log sources",
    );
    expect(getByRole("button", { name: "Open Source" })).toBeTruthy();
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

  it("opens source selection from the product action and leaves the workspace empty on cancellation", async () => {
    const platform = createMockPlatform();
    const { getByRole, queryAllByTestId, queryByRole } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByRole("button", { name: "Open Source" }));

    await waitFor(() => expect(platform.sourcePicker.pickFiles).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(platform.sourcePicker.pickDirectory).toHaveBeenCalledTimes(1));
    expect(queryAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(0);
    expect(queryByRole("heading", { name: "app.log" })).toBeNull();
  });

  it("opens a selected file without using sample panes", async () => {
    const platform = createMockPlatform({
      selectedFiles: [{ id: "selected-app", name: "selected-app.log" }],
    });
    const { getByRole, getByText, queryByRole } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByRole("button", { name: "Open Source" }));

    await waitFor(() => expect(getByRole("heading", { name: "selected-app.log" })).toBeTruthy());
    expect(getByText("selected-app.log opened from selected source")).toBeTruthy();
    expect(queryByRole("heading", { name: "app.log" })).toBeNull();
    expect(platform.sourcePicker.pickDirectory).not.toHaveBeenCalled();
  });

  it("opens a selected directory through the source picker flow", async () => {
    const platform = createMockPlatform({
      selectedDirectory: { id: "selected-logs", name: "selected-logs" },
    });
    const { getByTestId, getByText } = render(<AppShell platform={platform} />);
    await settleShellEffects();

    fireEvent.click(getByTestId(redesignedShellTestIds.emptyOpenSource));

    await waitFor(() =>
      expect(getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle).textContent).toBe("selected-logs"),
    );
    expect(getByText("selected-current.log")).toBeTruthy();
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
    },
    sourcePicker: {
      pickFiles: vi.fn(async () => options.selectedFiles ?? []),
      pickDirectory: vi.fn(async () => selectedDirectory),
    },
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => null),
    },
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
