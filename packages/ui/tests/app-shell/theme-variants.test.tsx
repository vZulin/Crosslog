import { readFileSync } from "node:fs";
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("theme variants", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  it("defines independent light and dark design tokens", () => {
    const themeCss = readThemeCss();

    expect(themeCss).toContain("--crosslog-screen-bg: #ececf1;");
    expect(themeCss).toContain("--crosslog-window-bg: #f5f5f7;");
    expect(themeCss).toContain("--crosslog-pane-bg: #ffffff;");
    expect(themeCss).toContain('--crosslog-shell-bg: var(--crosslog-window-bg);');
    expect(themeCss).toContain('--crosslog-surface: var(--crosslog-pane-bg);');
    expect(themeCss).toMatch(
      /\[data-theme="dark"\]\s*\{[^}]*--crosslog-screen-bg:\s*#111214;[^}]*--crosslog-window-bg:\s*#1c1c1e;[^}]*--crosslog-pane-bg:\s*#202124;/s,
    );
    expect(themeCss).toMatch(
      /\[data-theme="dark"\]\s*\{[^}]*--crosslog-warn-bg:\s*rgba\(255,\s*159,\s*10,\s*0\.18\);[^}]*--crosslog-error-text:\s*#ff453a;/s,
    );
  });

  it("applies the selected theme to actual shell surfaces", async () => {
    const { getAllByTestId, getByRole, getByTestId } = render(
      <AppShell
        platform={createMockPlatform()}
        shellPresentation={{ themeVariant: "dark", platformShellVariant: "web" }}
      />,
    );

    expect(getByTestId(redesignedShellTestIds.crosslogShell).getAttribute("data-theme")).toBe("dark");
    expect(getByTestId(redesignedShellTestIds.themeVariant).textContent).toBe("dark");
    expect(getByTestId(redesignedShellTestIds.topbar).className).toContain("crosslog-shell__topbar");
    expect(getByTestId(redesignedShellTestIds.activityRail).className).toContain("crosslog-shell__rail");
    expect(getByTestId(redesignedShellTestIds.paneWorkspace).className).toContain("crosslog-shell__workspace");
    expect(getByTestId(redesignedShellTestIds.statusBar).className).toContain("crosslog-shell__status");

    fireEvent.click(getByRole("button", { name: "Open Source" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));
    expect(getAllByTestId(redesignedShellTestIds.logPane)[0]?.className).toContain("crosslog-log-pane");
  });

  it("maps app surfaces, popovers, status, and log severity rows through theme tokens", () => {
    const themeCss = readThemeCss();

    expect(themeCss).toMatch(
      /\.crosslog-shell\s*\{[^}]*background:\s*var\(--crosslog-window-bg\);[^}]*color:\s*var\(--crosslog-text\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-shell__topbar\s*\{[^}]*background:\s*var\(--crosslog-topbar-bg\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-shell__rail\s*\{[^}]*background:\s*var\(--crosslog-rail-bg\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-shell__workspace\s*\{[^}]*background:\s*var\(--crosslog-pane-bg\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-shell__status\s*\{[^}]*background:\s*var\(--crosslog-rail-bg\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-popover\s*\{[^}]*background:\s*var\(--crosslog-pane-bg\);[^}]*color:\s*var\(--crosslog-text\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-viewport__row\[data-severity="warn"\][^}]*\{[^}]*background:\s*var\(--crosslog-warn-bg\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-viewport__row\[data-severity="error"\][^}]*\{[^}]*background:\s*var\(--crosslog-error-bg\);/s,
    );
  });
});

function readThemeCss(): string {
  return readFileSync("packages/ui/src/app-shell/activity-rail-theme.css", "utf8");
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
