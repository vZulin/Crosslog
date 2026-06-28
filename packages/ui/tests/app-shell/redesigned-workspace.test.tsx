import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
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
    const { getAllByTestId, getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);

    expect(getByTestId(redesignedShellTestIds.crosslogShell)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.topbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.commandField)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.activityRail)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.paneWorkspace)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("0 panes");

    expect(getByRole("button", { name: "Open Source" })).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "Open Source" }));

    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));
    expect(getAllByTestId(redesignedShellTestIds.paneHeader)).toHaveLength(3);
    expect(getByTestId(redesignedShellTestIds.workspaceScrollbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("3 panes");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Sync on");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain(
      "Active: app-2026-06-16.log",
    );
  });

  it("routes compact topbar controls and keeps future rail actions unavailable", async () => {
    const { getAllByTestId, getByRole, getByTestId, queryByLabelText, queryByText } = render(
      <AppShell platform={createMockPlatform()} />,
    );

    fireEvent.click(getByRole("button", { name: "Open Source" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

    const topbar = getByTestId(redesignedShellTestIds.topbar);
    expect(topbar.textContent).not.toContain("Sync on");
    expect(topbar.textContent).not.toContain("Sync off");
    expect(queryByText("Synchronize by time")).toBeNull();
    expect(queryByLabelText("Split active pane")).toBeNull();
    expect(getByRole("button", { name: "Toggle time synchronization" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(getByTestId(redesignedShellTestIds.topbarAddPane));
    expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(4);
    await waitFor(() => expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("4 panes"));

    expect(getByTestId(redesignedShellTestIds.activityRailFilter).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailPalette).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailBookmark).hasAttribute("disabled")).toBe(true);
  });
});

function createMockPlatform(): CrosslogPlatform {
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
      openFileReadOnly: vi.fn(async () => ({
        ok: false,
        error: { code: "UnsupportedCapability", message: "File access is not used by this test." },
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
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => null),
    },
  };
}
