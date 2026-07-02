import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource } from "@crosslog/core";
import type { CrosslogPlatform, FileSourceRef } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("redesigned workspace shell", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("renders topbar, activity rail, pane workspace, and status bar around opened panes", async () => {
    const { getAllByTestId, getByRole, getByTestId, queryByRole } = render(
      <AppShell
        platform={createMockPlatform({
          selectedFileBatches: [[{ id: "selected-app", name: "selected-app.log" }]],
        })}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.crosslogShell)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.topbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.commandField)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.activityRail)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.paneWorkspace)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("0 panes");

    expect(getByRole("button", { name: "Open File" })).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "Open File" }));

    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(1));
    expect(getAllByTestId(redesignedShellTestIds.paneHeader)).toHaveLength(1);
    expect(getByTestId(redesignedShellTestIds.workspaceScrollbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("1 pane");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Sync on");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Active: selected-app.log");
    expect(queryByRole("heading", { name: "app.log" })).toBeNull();
  });

  it("routes compact topbar controls and keeps future rail actions unavailable", async () => {
    const platform = createMockPlatform({
      selectedFileBatches: [
        [{ id: "selected-app", name: "selected-app.log" }],
        [{ id: "selected-service", name: "selected-service.log" }],
      ],
    });
    const { getAllByTestId, getByRole, getByTestId, queryByLabelText, queryByText } = render(
      <AppShell platform={platform} />,
    );

    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(1));

    const topbar = getByTestId(redesignedShellTestIds.topbar);
    expect(topbar.textContent).not.toContain("Sync on");
    expect(topbar.textContent).not.toContain("Sync off");
    expect(queryByText("Synchronize by time")).toBeNull();
    expect(queryByLabelText("Split active pane")).toBeNull();
    expect(getByRole("button", { name: "Toggle time synchronization" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(getByTestId(redesignedShellTestIds.topbarAddFile));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(2));
    await waitFor(() => expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("2 panes"));
    expect(platform.sourcePicker.pickFiles).toHaveBeenCalledTimes(2);
    expect(getByRole("heading", { name: "selected-service.log" })).toBeTruthy();

    expect(getByTestId(redesignedShellTestIds.activityRailFiles).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailSearch).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailFilter).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailPalette).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailBookmark).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.commandField).hasAttribute("disabled")).toBe(true);
  });
});

interface MockPlatformOptions {
  readonly selectedFileBatches?: readonly (readonly FileSourceRef[])[];
}

function createMockPlatform(options: MockPlatformOptions = {}): CrosslogPlatform {
  const selectedFileBatches = [...(options.selectedFileBatches ?? [])];

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
      listTopLevelFiles: vi.fn(async () => []),
      refreshDirectory: vi.fn(async () => []),
    },
    dragDropSource: {
      mapDroppedSources: vi.fn(async () => []),
    },
    sourcePicker: {
      pickFiles: vi.fn(async () => selectedFileBatches.shift() ?? []),
      pickDirectory: vi.fn(async () => null),
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
