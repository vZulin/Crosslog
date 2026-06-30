import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("pane-local popovers", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("opens pane search in the invoking left, middle, and right panes", async () => {
    const { getAllByTestId, getByRole, queryAllByTestId } = render(<AppShell platform={createMockPlatform()} />);
    const panes = await openSamplePanes(getAllByTestId, getByRole);

    for (const pane of panes) {
      fireEvent.click(within(pane).getByTestId(redesignedShellTestIds.paneHeaderSearch));

      await waitFor(() => expect(queryAllByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveLength(1));
      expect(within(pane).getByTestId(redesignedShellTestIds.paneSearchPopover)).toBeTruthy();
    }

    const rightPane = panes[2]!;
    const rightSearchTrigger = within(rightPane).getByTestId(redesignedShellTestIds.paneHeaderSearch);
    const rightSearchField = within(rightPane).getByTestId(redesignedShellTestIds.paneSearchField);

    await waitFor(() => expect(document.activeElement).toBe(rightSearchField));

    fireEvent.keyDown(rightSearchField, { key: "Escape" });

    await waitFor(() => expect(queryAllByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveLength(0));
    expect(document.activeElement).toBe(rightSearchTrigger);
  });

  it("opens time offset in the invoking left, middle, and right panes", async () => {
    const { getAllByTestId, getByRole, queryAllByTestId } = render(<AppShell platform={createMockPlatform()} />);
    const panes = await openSamplePanes(getAllByTestId, getByRole);

    for (const pane of panes) {
      fireEvent.click(within(pane).getByTestId(redesignedShellTestIds.paneHeaderOffset));

      await waitFor(() => expect(queryAllByTestId(redesignedShellTestIds.timeOffsetPopover)).toHaveLength(1));
      expect(within(pane).getByTestId(redesignedShellTestIds.timeOffsetPopover)).toBeTruthy();
      expect(
        within(pane).queryByRole("button", { name: /Close time offset for /u }),
      ).toBeNull();
    }

    const middlePane = panes[1]!;
    const middleOffsetTrigger = within(middlePane).getByTestId(redesignedShellTestIds.paneHeaderOffset);
    fireEvent.click(middleOffsetTrigger);

    await waitFor(() => expect(queryAllByTestId(redesignedShellTestIds.timeOffsetPopover)).toHaveLength(1));
    expect(within(middlePane).getByTestId(redesignedShellTestIds.timeOffsetPopover)).toBeTruthy();

    const middleMinutesField = within(middlePane).getByTestId(redesignedShellTestIds.timeOffsetMinutes);

    fireEvent.change(middleMinutesField, { target: { value: "invalid" } });
    expect(within(middlePane).getByRole("alert").textContent).toContain("whole-number");

    fireEvent.keyDown(middleMinutesField, { key: "Escape" });

    await waitFor(() => expect(queryAllByTestId(redesignedShellTestIds.timeOffsetPopover)).toHaveLength(0));
    expect(document.activeElement).toBe(middleOffsetTrigger);
  });
});

async function openSamplePanes(
  getAllByTestId: (testId: string) => HTMLElement[],
  getByRole: (role: string, options?: { readonly name?: string | RegExp }) => HTMLElement,
): Promise<readonly [HTMLElement, HTMLElement, HTMLElement]> {
  fireEvent.click(getByRole("button", { name: "Open Source" }));

  await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

  const panes = getAllByTestId(redesignedShellTestIds.logPane);
  return [panes[0]!, panes[1]!, panes[2]!];
}

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
