import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource } from "@crosslog/core";
import type { CrosslogPlatform, FileSourceRef } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("redesigned search entry points", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("keeps pane-local search in pane headers and leaves global search entry points disabled", async () => {
    const { getAllByTestId, getByRole, getByTestId } = render(
      <AppShell
        platform={createMockPlatform({
          selectedFiles: [{ id: "selected-app", name: "selected-app.log" }],
        })}
      />,
    );

    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(1));

    const panes = getAllByTestId(redesignedShellTestIds.logPane);
    const appPane = panes[0]!;

    const appPaneSearchButton = within(appPane).getByRole("button", { name: "Search in selected-app.log" });

    fireEvent.click(appPaneSearchButton);
    await waitFor(() =>
      expect(within(appPane).getByRole("dialog", { name: "Pane search for selected-app.log" })).toBeTruthy(),
    );
    fireEvent.keyDown(within(appPane).getByTestId(redesignedShellTestIds.paneSearchField), {
      key: "Escape",
    });
    await waitFor(() => expect(within(appPane).queryByTestId(redesignedShellTestIds.paneSearchPopover)).toBeNull());
    expect(document.activeElement).toBe(appPaneSearchButton);

    const railSearch = getByTestId(redesignedShellTestIds.activityRailSearch);
    expect(railSearch.hasAttribute("disabled")).toBe(true);
    fireEvent.click(railSearch);
    expect(within(appPane).queryByTestId(redesignedShellTestIds.paneSearchPopover)).toBeNull();

    const commandField = getByTestId(redesignedShellTestIds.commandField);
    expect(commandField.hasAttribute("disabled")).toBe(true);
    fireEvent.focus(commandField);
    fireEvent.keyDown(commandField, { key: "Enter" });
    expect(within(appPane).queryByTestId(redesignedShellTestIds.paneSearchPopover)).toBeNull();
  });
});

interface MockPlatformOptions {
  readonly selectedFiles?: readonly FileSourceRef[];
}

function createMockPlatform(options: MockPlatformOptions = {}): CrosslogPlatform {
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
      pickFiles: vi.fn(async () => options.selectedFiles ?? []),
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
