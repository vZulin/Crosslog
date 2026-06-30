import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("redesigned search entry points", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("opens pane search from the pane header, activity rail, and command field", async () => {
    const { getAllByTestId, getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);

    fireEvent.click(getByRole("button", { name: "Open Source" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

    const panes = getAllByTestId(redesignedShellTestIds.logPane);
    const appPane = panes[0]!;
    const servicePane = panes[1]!;
    const directoryPane = panes[2]!;

    const appPaneSearchButton = within(appPane).getByRole("button", { name: "Search in app.log" });

    fireEvent.click(appPaneSearchButton);
    await waitFor(() =>
      expect(within(appPane).getByRole("dialog", { name: "Pane search for app.log" })).toBeTruthy(),
    );
    fireEvent.keyDown(within(appPane).getByTestId(redesignedShellTestIds.paneSearchField), {
      key: "Escape",
    });
    await waitFor(() => expect(within(appPane).queryByTestId(redesignedShellTestIds.paneSearchPopover)).toBeNull());
    expect(document.activeElement).toBe(appPaneSearchButton);

    fireEvent.click(servicePane);
    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailSearch));
    await waitFor(() =>
      expect(within(servicePane).getByRole("dialog", { name: "Pane search for service.log" })).toBeTruthy(),
    );
    expect(within(appPane).queryByTestId(redesignedShellTestIds.paneSearchPopover)).toBeNull();

    fireEvent.click(directoryPane);
    fireEvent.focus(getByTestId(redesignedShellTestIds.commandField));
    await waitFor(() =>
      expect(
        within(directoryPane).getByRole("dialog", {
          name: "Pane search for app-2026-06-16.log",
        }),
      ).toBeTruthy(),
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
    sourcePicker: {
      pickFiles: vi.fn(async () => []),
      pickDirectory: vi.fn(async () => null),
    },
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => null),
    },
  };
}
