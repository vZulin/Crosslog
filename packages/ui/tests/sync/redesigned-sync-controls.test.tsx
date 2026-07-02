import { readFileSync } from "node:fs";
import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource } from "@crosslog/core";
import type { CrosslogPlatform, FileSourceRef } from "@crosslog/platform";
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

    fireEvent.click(getByRole("button", { name: "Open File" }));

    await waitFor(() => expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("3 panes"));
    const topbarSync = getByTestId(redesignedShellTestIds.topbarSync);
    const syncToggle = within(topbarSync).getByRole("button", { name: "Toggle time synchronization" });

    expect(syncToggle.getAttribute("aria-pressed")).toBe("true");
    expect(topbarSync.getAttribute("data-sync-state")).toBe("active");
    expect(syncToggle.getAttribute("data-sync-state")).toBe("active");
    expect(topbarSync.textContent).not.toContain("Sync on");
    expect(topbarSync.textContent).not.toContain("Sync off");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Sync on");

    fireEvent.click(syncToggle);

    await waitFor(() => expect(syncToggle.getAttribute("aria-pressed")).toBe("false"));
    expect(topbarSync.getAttribute("data-sync-state")).toBe("inactive");
    expect(syncToggle.getAttribute("data-sync-state")).toBe("inactive");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Sync off");
  });

  it("defines distinct inactive, active, and hover styles for the topbar sync control", () => {
    const themeCss = readFileSync("packages/ui/src/app-shell/activity-rail-theme.css", "utf8");

    expect(themeCss).toMatch(
      /\.crosslog-topbar__sync\[data-sync-state="inactive"\]\s+\.crosslog-sync-toggle\s*\{[^}]*background:\s*var\(--crosslog-toolbar-surface\);[^}]*color:\s*var\(--crosslog-muted-text\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-topbar__sync\[data-sync-state="active"\]\s+\.crosslog-sync-toggle\s*\{[^}]*background:\s*var\(--crosslog-accent-surface\);[^}]*color:\s*var\(--crosslog-accent\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-topbar__sync\s+\.crosslog-sync-toggle:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--crosslog-accent-surface\);[^}]*color:\s*var\(--crosslog-accent\);/s,
    );
  });

  it("marks the active pane header and updates the active source summary", async () => {
    const { getAllByTestId, getByRole, getByTestId, getByText } = render(
      <AppShell platform={createMockPlatform()} />,
    );

    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

    const headers = getAllByTestId(redesignedShellTestIds.paneHeader);
    expect(headers[0]?.getAttribute("aria-current")).toBeNull();
    expect(headers[2]?.getAttribute("aria-current")).toBe("true");
    expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Active: worker.log");

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
  const selectedFiles = createSelectedFiles();

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
      pickFiles: vi.fn(async () => selectedFiles),
      pickDirectory: vi.fn(async () => null),
    },
    sessionStore: {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => null),
    },
  };
}

function createSelectedFiles(): readonly FileSourceRef[] {
  return [
    { id: "selected-app", name: "app.log" },
    { id: "selected-service", name: "service.log" },
    { id: "selected-worker", name: "worker.log" },
  ];
}

function createTestFileSource(sourceRef: FileSourceRef): FileSource {
  const lines = [
    `2026-06-16T09:00:00.000Z ${sourceRef.name} boot sequence started`,
    `2026-06-16T09:00:01.250Z ${sourceRef.name} connected to upstream service`,
    `2026-06-16T09:00:02.500Z ${sourceRef.name} processed request id=42 status=ok`,
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
