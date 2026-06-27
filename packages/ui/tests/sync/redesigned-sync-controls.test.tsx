import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("redesigned synchronization controls", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("keeps the topbar synchronization state and status summary in sync", async () => {
    const { getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);

    fireEvent.click(getByRole("button", { name: "Open logs" }));

    await waitFor(() => expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("3 panes"));
    const topbarSync = getByTestId(redesignedShellTestIds.topbarSync);
    const syncToggle = within(topbarSync).getByRole("checkbox", { name: "Synchronize by time" }) as HTMLInputElement;

    expect(syncToggle.checked).toBe(true);
    expect(topbarSync.textContent).toContain("Sync on");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Sync on");

    fireEvent.click(syncToggle);

    await waitFor(() => expect(topbarSync.textContent).toContain("Sync off"));
    expect(syncToggle.checked).toBe(false);
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Sync off");
  });

  it("marks the active pane header and updates the active source summary", async () => {
    const { getAllByTestId, getByRole, getByTestId, getByText } = render(
      <AppShell platform={createMockPlatform()} />,
    );

    fireEvent.click(getByRole("button", { name: "Open logs" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

    const headers = getAllByTestId(redesignedShellTestIds.paneHeader);
    expect(headers[0]?.getAttribute("aria-current")).toBeNull();
    expect(headers[2]?.getAttribute("aria-current")).toBe("true");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain(
      "Active: app-2026-06-16.log",
    );

    fireEvent.click(getByText("2026-06-16T09:00:02.500Z app.log processed request id=42 status=ok"));

    await waitFor(() => expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Active: app.log"));
    expect(headers[0]?.getAttribute("aria-current")).toBe("true");
    expect(headers[2]?.getAttribute("aria-current")).toBeNull();
  });

  it("keeps untimed-pane exclusion messaging in the redesigned status region", async () => {
    useSynchronizationStore.getState().setPlanResult([], ["pane-untimed-a", "pane-untimed-b"]);

    const { getByTestId } = render(<AppShell platform={createMockPlatform()} />);

    await waitFor(() =>
      expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("2 untimed panes excluded"),
    );
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
