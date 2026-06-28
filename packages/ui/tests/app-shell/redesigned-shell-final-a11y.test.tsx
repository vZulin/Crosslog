import { readFileSync } from "node:fs";
import React, { act } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("final redesigned shell accessibility and no-overlap contracts", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  for (const viewport of supportedViewports) {
    it(`keeps primary controls accessible at the ${viewport.name} viewport`, async () => {
      setViewport(viewport.width, viewport.height);

      const platform = createMockPlatform();
      const { getAllByTestId, getByRole } = render(<AppShell platform={platform} />);
      await act(async () => {
        await Promise.resolve();
      });

      expect(getByRole("main", { name: "Crosslog workspace" })).toBeTruthy();
      expect(getByRole("searchbox", { name: "Command or workspace search" })).toBeTruthy();
      expect(getByRole("button", { name: "Toggle time synchronization" })).toBeTruthy();
      expect(getByRole("button", { name: "Add pane" })).toBeTruthy();
      expect(getByRole("button", { name: "Search logs" })).toBeTruthy();
      expect(getByRole("button", { name: "Open sources" })).toBeTruthy();
      expect(getByRole("button", { name: "Filters unavailable" }).hasAttribute("disabled")).toBe(true);
      expect(getByRole("button", { name: "Highlighting unavailable" }).hasAttribute("disabled")).toBe(true);
      expect(getByRole("button", { name: "Bookmarks unavailable" }).hasAttribute("disabled")).toBe(true);

      await waitFor(() => expect(platform.sessionStore.recoverSession).toHaveBeenCalled());
      await act(async () => {
        fireEvent.click(getByRole("button", { name: "Open Source" }));
        await Promise.resolve();
      });

      await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));
      await waitFor(() => expect(platform.sessionStore.writeSessionSnapshot).toHaveBeenCalled());
      expect(getByRole("button", { name: "Add pane" })).toBeTruthy();
      expect(getByRole("button", { name: "Search in app.log" })).toBeTruthy();
      expect(getByRole("button", { name: "Close pane app.log" })).toBeTruthy();
      expect(getByRole("button", { name: "Time offset for app.log: 0 ms" })).toBeTruthy();
      expect(getByRole("status", { name: /3 panes, Sync on, active source app-2026-06-16\.log/ })).toBeTruthy();

      await act(async () => {
        fireEvent.click(getByRole("button", { name: "Search in app.log" }));
        await Promise.resolve();
      });
      expect(getByRole("dialog", { name: "Pane search for app.log" })).toBeTruthy();
      expect(getByRole("searchbox", { name: "Search app.log" })).toBeTruthy();
      expect(getByRole("checkbox", { name: "Case-sensitive search for app.log" })).toBeTruthy();
      expect(getByRole("checkbox", { name: "Regular expression search for app.log" })).toBeTruthy();

      await act(async () => {
        fireEvent.click(getByRole("button", { name: "Time offset for app.log: 0 ms" }));
        await Promise.resolve();
      });
      expect(getByRole("dialog", { name: "Time offset for app.log" })).toBeTruthy();
      expect(getByRole("textbox", { name: "Days offset for app.log" })).toBeTruthy();
      expect(getByRole("textbox", { name: "Milliseconds offset for app.log" })).toBeTruthy();
      expect(getByRole("button", { name: "Apply time offset for app.log" })).toBeTruthy();
    });
  }

  it("keeps no-overlap responsive layout constraints in the shared shell stylesheet", () => {
    const themeCss = readFileSync(
      "packages/ui/src/app-shell/activity-rail-theme.css",
      "utf8",
    );

    expect(themeCss).toMatch(
      /\.crosslog-shell\s*\{[^}]*grid-template:[^}]*"topbar topbar"[^}]*"rail workspace"[^}]*"status status"/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-pane-header\s*\{[^}]*display:\s*flex;[^}]*gap:\s*10px;[^}]*min-inline-size:\s*0;/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-pane-header__actions\s*\{[^}]*flex:\s*0 0 auto;[^}]*gap:\s*8px;/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-pane-header__title,[^}]*\.crosslog-status-bar__active-source\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-status-bar\s*\{[^}]*grid-template-columns:\s*auto auto minmax\(0,\s*1fr\) auto;/s,
    );
    expect(themeCss).toContain("@media (max-width: 720px)");
  });
});

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
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

const supportedViewports = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "narrow", width: 640, height: 720 },
] as const;
