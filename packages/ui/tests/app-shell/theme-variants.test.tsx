import { readFileSync } from "node:fs";
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource } from "@crosslog/core";
import type { CrosslogPlatform, FileSourceRef } from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("theme variants", () => {
  let restoreMatchMedia: (() => void) | null = null;

  beforeEach(() => {
    restoreMatchMedia?.();
    restoreMatchMedia = null;
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  afterEach(() => {
    restoreMatchMedia?.();
    restoreMatchMedia = null;
  });

  it("defines independent light and dark design tokens", () => {
    const themeCss = readThemeCss();
    const mockupCss = readMockupCss();
    const expectedDarkTokens = mapMockupDarkTokens(
      readCssCustomProperties(mockupCss, '.variant[data-theme="dark"]'),
    );
    const actualDarkTokens = readCssCustomProperties(themeCss, '[data-theme="dark"]');

    expect(themeCss).toContain("--crosslog-screen-bg: #ececf1;");
    expect(themeCss).toContain("--crosslog-window-bg: #f5f5f7;");
    expect(themeCss).toContain("--crosslog-pane-bg: #ffffff;");
    expect(themeCss).toContain('--crosslog-shell-bg: var(--crosslog-window-bg);');
    expect(themeCss).toContain('--crosslog-surface: var(--crosslog-pane-bg);');
    expect(pickTokens(actualDarkTokens, Object.keys(expectedDarkTokens))).toEqual(expectedDarkTokens);
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

    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));
    expect(getAllByTestId(redesignedShellTestIds.logPane)[0]?.className).toContain("crosslog-log-pane");
  });

  it("defaults product theme preference to System and resolves from the current system theme", async () => {
    restoreMatchMedia = installMatchMediaMock(true).restore;
    const { getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId(redesignedShellTestIds.crosslogShell).getAttribute("data-theme")).toBe("dark");

    fireEvent.click(getByRole("button", { name: "Settings" }));

    expect((getByRole("radio", { name: "System" }) as HTMLInputElement).checked).toBe(true);
    expect((getByRole("radio", { name: "Light" }) as HTMLInputElement).checked).toBe(false);
    expect((getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(false);
  });

  it("updates live System theme resolution while the app is open", async () => {
    const matchMediaMock = installMatchMediaMock(false);
    restoreMatchMedia = matchMediaMock.restore;
    const { getByTestId } = render(<AppShell platform={createMockPlatform()} />);
    const shell = getByTestId(redesignedShellTestIds.crosslogShell);

    expect(shell.getAttribute("data-theme")).toBe("light");

    await act(async () => {
      matchMediaMock.setPrefersDark(true);
    });

    expect(shell.getAttribute("data-theme")).toBe("dark");
  });

  it("switches theme without resetting panes, search, or synchronization state", async () => {
    restoreMatchMedia = installMatchMediaMock(false).restore;
    const { getAllByTestId, getByRole, getByTestId } = render(<AppShell platform={createMockPlatform()} />);

    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3));

    fireEvent.click(getByRole("button", { name: "Search in app.log" }));
    const searchField = getByRole("searchbox", { name: "Search app.log" }) as HTMLInputElement;
    fireEvent.change(searchField, { target: { value: "processed" } });
    fireEvent.click(getByRole("button", { name: "Toggle time synchronization" }));
    await waitFor(() =>
      expect(getByRole("button", { name: "Toggle time synchronization" }).getAttribute("aria-pressed")).toBe("false"),
    );

    fireEvent.click(getByRole("button", { name: "Settings" }));
    fireEvent.click(getByRole("radio", { name: "Dark" }));

    expect(getByTestId(redesignedShellTestIds.crosslogShell).getAttribute("data-theme")).toBe("dark");
    expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3);
    expect(getByRole("dialog", { name: "Pane search for app.log" })).toBeTruthy();
    expect(searchField.value).toBe("processed");
    expect(getByRole("button", { name: "Toggle time synchronization" }).getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(getByRole("radio", { name: "System" }));
    expect(getByTestId(redesignedShellTestIds.crosslogShell).getAttribute("data-theme")).toBe("light");
    expect(getAllByTestId(redesignedShellTestIds.logPane)).toHaveLength(3);
  });

  it("maps app surfaces, popovers, status, and log severity rows through theme tokens", () => {
    const themeCss = readThemeCss();
    const lightTokens = readCssCustomProperties(themeCss, ":root");
    const darkTokens = readCssCustomProperties(themeCss, '[data-theme="dark"]');

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
    expect(lightTokens["--crosslog-log-token-foreground"]).toBe("#1d1d1f");
    expect(lightTokens["--crosslog-log-token-severity"]).toBe("#1d1d1f");
    expect(lightTokens["--crosslog-log-token-timestamp"]).toBe("#098658");
    expect(lightTokens["--crosslog-log-token-qualified"]).toBe("#0451a5");
    expect(lightTokens["--crosslog-log-token-property"]).toBe("#1d1d1f");
    expect(lightTokens["--crosslog-log-token-string"]).toBe("#a31515");
    expect(lightTokens["--crosslog-log-token-stacktrace"]).toBe("#a31515");
    expect(lightTokens["--crosslog-log-token-number"]).toBe("#0451a5");
    expect(lightTokens["--crosslog-log-token-constant"]).toBe("#0000ff");
    expect(darkTokens["--crosslog-log-token-foreground"]).toBe("#d4d4d4");
    expect(darkTokens["--crosslog-log-token-severity"]).toBe("#d4d4d4");
    expect(darkTokens["--crosslog-log-token-timestamp"]).toBe("#6a9955");
    expect(darkTokens["--crosslog-log-token-qualified"]).toBe("#4fc1ff");
    expect(darkTokens["--crosslog-log-token-property"]).toBe("#d4d4d4");
    expect(darkTokens["--crosslog-log-token-string"]).toBe("#ce9178");
    expect(darkTokens["--crosslog-log-token-stacktrace"]).toBe("#ce9178");
    expect(darkTokens["--crosslog-log-token-number"]).toBe("#79c0ff");
    expect(darkTokens["--crosslog-log-token-constant"]).toBe("#569cd6");
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="severity"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-severity\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="property"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-property\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="qualified"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-qualified\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="stacktrace"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-stacktrace\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="string"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-string\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="timestamp"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-timestamp\);/s,
    );
    expect(themeCss).toMatch(
      /\.crosslog-log-token\[data-log-token-kind="constant"\][^}]*\{[^}]*color:\s*var\(--crosslog-log-token-constant\);/s,
    );
  });
});

function readThemeCss(): string {
  return readFileSync("packages/ui/src/app-shell/activity-rail-theme.css", "utf8");
}

function readMockupCss(): string {
  return readFileSync("docs/mockups/crosslog-macos-redesign-mockups.html", "utf8");
}

function readCssCustomProperties(css: string, selector: string): Record<string, string> {
  const selectorPattern = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockMatch = new RegExp(`${selectorPattern}\\s*\\{(?<body>[^}]*)\\}`, "s").exec(css);
  const body = blockMatch?.groups?.body;

  expect(body, `Expected CSS selector '${selector}'`).toBeDefined();

  return Object.fromEntries(
    [...body!.matchAll(/(?<name>--[\w-]+)\s*:\s*(?<value>[^;]+);/g)].map((match) => [
      match.groups!.name,
      match.groups!.value.trim(),
    ]),
  );
}

function mapMockupDarkTokens(mockupTokens: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(mockupTokens).map(([name, value]) => [`--crosslog-${name.slice(2)}`, value]),
  );
}

function pickTokens(tokens: Record<string, string>, names: readonly string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, tokens[name]]));
}

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

function installMatchMediaMock(initialPrefersDark: boolean): {
  readonly restore: () => void;
  readonly setPrefersDark: (prefersDark: boolean) => void;
} {
  const originalMatchMedia = window.matchMedia;
  let prefersDark = initialPrefersDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    get matches() {
      return prefersDark;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_event: "change", listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_event: "change", listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => mediaQueryList),
  });

  return {
    restore: () => {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    },
    setPrefersDark: (nextPrefersDark: boolean) => {
      prefersDark = nextPrefersDark;
      const event = { matches: prefersDark, media: mediaQueryList.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}
