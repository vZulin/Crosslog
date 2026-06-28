import React from "react";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("obsolete product controls", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("keeps removed controls absent in empty and populated workspaces", async () => {
    const { container, getAllByTestId, getByRole, getByTestId, queryByLabelText, queryByText } = render(
      <AppShell platform={createMockPlatform()} />,
    );
    await settleShellEffects();
    const topbar = getByTestId(redesignedShellTestIds.topbar);

    expect(getByRole("button", { name: "Open Source" })).toBeTruthy();
    expect(queryByText("Open logs")).toBeNull();
    expect(queryByText("Synchronize by time")).toBeNull();
    expect(within(topbar).queryByText("Sync on")).toBeNull();
    expect(within(topbar).queryByText("Sync off")).toBeNull();
    expect(queryByLabelText("Split active pane")).toBeNull();
    expect(queryByText("Discover newer directory file")).toBeNull();
    expect(queryByText("Append live line")).toBeNull();
    expect(queryByText("Delete active file")).toBeNull();
    expect(queryByText("Replace active file")).toBeNull();
    expect(queryByLabelText("Discover newer directory file")).toBeNull();
    expect(queryByLabelText("Append live line")).toBeNull();
    expect(queryByLabelText("Delete active file")).toBeNull();
    expect(queryByLabelText("Replace active file")).toBeNull();
    expect(container.querySelector('[data-ui-test-action="openEmptyDirectory"]')).toBeNull();

    fireEvent.click(getByRole("button", { name: "Open Source" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

    expect(container.querySelector(".crosslog-workspace-actions")).toBeNull();
    expect(container.querySelector(".crosslog-pane-tools")).toBeNull();
    expect(container.querySelector(".crosslog-log-text-selection__copy")).toBeNull();
    expect(container.querySelector(".crosslog-pane-status")).toBeNull();
    expect(queryByText("Copy")).toBeNull();
    expect(queryByText("Split")).toBeNull();
    expect(queryByText("Discover newer directory file")).toBeNull();
    expect(queryByText("Append live line")).toBeNull();
    expect(queryByText("Delete active file")).toBeNull();
    expect(queryByText("Replace active file")).toBeNull();
    expect(queryByLabelText("Discover newer directory file")).toBeNull();
    expect(queryByLabelText("Append live line")).toBeNull();
    expect(queryByLabelText("Delete active file")).toBeNull();
    expect(queryByLabelText("Replace active file")).toBeNull();
  });

  it("does not expose Directory Search as an active left-panel feature", async () => {
    const { queryByRole, queryByText } = render(<AppShell platform={createMockPlatform()} />);
    await settleShellEffects();

    expect(queryByRole("complementary", { name: /directory search/i })).toBeNull();
    expect(queryByText("Directory Search")).toBeNull();
  });
});

async function settleShellEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
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
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => null),
    },
  };
}
