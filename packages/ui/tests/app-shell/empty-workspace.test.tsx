import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
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
    const { getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);
    await settleShellEffects();

    expect(getByTestId(redesignedShellTestIds.topbar)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.activityRail)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.emptyWorkspace)).toBeTruthy();
    expect(getByTestId(redesignedShellTestIds.emptyDropZone).getAttribute("aria-label")).toBe(
      "Drop log sources",
    );
    expect(getByRole("button", { name: "Open Source" })).toBeTruthy();
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
