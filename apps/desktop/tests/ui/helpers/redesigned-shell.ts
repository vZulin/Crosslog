import { appendFileSync } from "node:fs";
import { browser, expect } from "@wdio/globals";
import type { UiTestAction } from "@crosslog/platform";
import {
  redesignedShellObsoleteControlTestIds,
  redesignedShellStructuralTestIds,
  redesignedShellTestIds,
  shellPresentationChangeEventName,
  type RedesignedShellTestId,
} from "@crosslog/ui";

export type ShellThemeVariant = "light" | "dark";
export type ShellPlatformVariant = "macos" | "windows" | "linux" | "web";

/**
 * Shared Desktop shell selectors for WDIO coverage of the aligned shell.
 *
 * Use these helpers for shell regions, theme/platform chrome evidence,
 * obsolete-control absence, drag resize boundaries, and UI bridge workflows.
 * Lifecycle and source setup actions are intentionally bridge-only because the
 * previous visible workspace action toolbar is no longer product UI.
 */
export function redesignedShellSelectors() {
  return {
    shell: byTestId(redesignedShellTestIds.crosslogShell),
    topbar: byTestId(redesignedShellTestIds.topbar),
    commandField: byTestId(redesignedShellTestIds.commandField),
    topbarSync: byTestId(redesignedShellTestIds.topbarSync),
    topbarAddPane: byTestId(redesignedShellTestIds.topbarAddPane),
    topbarAddFile: byTestId(redesignedShellTestIds.topbarAddFile),
    topbarAddDirectory: byTestId(redesignedShellTestIds.topbarAddDirectory),
    themeVariant: byTestId(redesignedShellTestIds.themeVariant),
    platformChrome: byTestId(redesignedShellTestIds.platformChrome),
    activityRail: byTestId(redesignedShellTestIds.activityRail),
    settingsSurface: byTestId(redesignedShellTestIds.settingsSurface),
    settingsThemeSystem: byTestId(redesignedShellTestIds.settingsThemeSystem),
    settingsThemeLight: byTestId(redesignedShellTestIds.settingsThemeLight),
    settingsThemeDark: byTestId(redesignedShellTestIds.settingsThemeDark),
    emptyWorkspace: byTestId(redesignedShellTestIds.emptyWorkspace),
    emptyDropZone: byTestId(redesignedShellTestIds.emptyDropZone),
    emptyOpenSource: byTestId(redesignedShellTestIds.emptyOpenSource),
    emptyOpenFile: byTestId(redesignedShellTestIds.emptyOpenFile),
    emptyOpenDirectory: byTestId(redesignedShellTestIds.emptyOpenDirectory),
    paneWorkspace: byTestId(redesignedShellTestIds.paneWorkspace),
    paneResizeBoundary: byTestId(redesignedShellTestIds.paneResizeBoundary),
    logPane: byTestId(redesignedShellTestIds.logPane),
    paneSearchPopover: byTestId(redesignedShellTestIds.paneSearchPopover),
    timeOffsetPopover: byTestId(redesignedShellTestIds.timeOffsetPopover),
    statusBar: byTestId(redesignedShellTestIds.statusBar),
    obsoleteControls: redesignedShellObsoleteControlTestIds.map(byTestId),
  };
}

export function getRedesignedShell() {
  const selectors = redesignedShellSelectors();

  return {
    shell: browser.$(selectors.shell),
    topbar: browser.$(selectors.topbar),
    commandField: browser.$(selectors.commandField),
    topbarSync: browser.$(selectors.topbarSync),
    topbarAddPane: browser.$(selectors.topbarAddPane),
    topbarAddFile: browser.$(selectors.topbarAddFile),
    topbarAddDirectory: browser.$(selectors.topbarAddDirectory),
    themeVariant: browser.$(selectors.themeVariant),
    platformChrome: browser.$(selectors.platformChrome),
    activityRail: browser.$(selectors.activityRail),
    settingsSurface: browser.$(selectors.settingsSurface),
    settingsThemeSystem: browser.$(selectors.settingsThemeSystem),
    settingsThemeLight: browser.$(selectors.settingsThemeLight),
    settingsThemeDark: browser.$(selectors.settingsThemeDark),
    emptyWorkspace: browser.$(selectors.emptyWorkspace),
    emptyDropZone: browser.$(selectors.emptyDropZone),
    emptyOpenSource: browser.$(selectors.emptyOpenSource),
    emptyOpenFile: browser.$(selectors.emptyOpenFile),
    emptyOpenDirectory: browser.$(selectors.emptyOpenDirectory),
    paneWorkspace: browser.$(selectors.paneWorkspace),
    paneResizeBoundaries: browser.$$(selectors.paneResizeBoundary),
    logPanes: browser.$$(selectors.logPane),
    paneSearchPopover: browser.$(selectors.paneSearchPopover),
    timeOffsetPopover: browser.$(selectors.timeOffsetPopover),
    statusBar: browser.$(selectors.statusBar),
    obsoleteControls: selectors.obsoleteControls.map((selector) => browser.$(selector)),
  };
}

export async function waitForDesktopShell(): Promise<void> {
  const workspaceSelector = 'main[aria-label="Crosslog workspace"]';

  await browser.waitUntil(async () => browser.$(workspaceSelector).isExisting(), {
    interval: 250,
    timeout: 45_000,
    timeoutMsg: `Crosslog desktop workspace did not mount: ${workspaceSelector}`,
  });
}

export async function openSampleLogsWithUiBridge(): Promise<void> {
  enqueueDesktopUiTestAction("openSampleLogs");
  await waitForUiTestTitleFragment("state=logs");
  await waitForUiTestTitleFragment("panes=3");
  await waitForUiTestTitleFragment("session=written");
  await expect(browser.$$(redesignedShellSelectors().logPane)).toBeElementsArrayOfSize(3);
}

export async function getLogPaneByTitle(title: string): Promise<WebdriverIO.Element> {
  const pane = await browser.$(
    `${byTestId(redesignedShellTestIds.logPane)}[aria-label=${JSON.stringify(`Log pane ${title}`)}]`,
  );

  await pane.waitForExist();
  return pane;
}

export async function activateLogPaneByTitle(title: string): Promise<WebdriverIO.Element> {
  const pane = await getLogPaneByTitle(title);

  await clickElementWithJavaScript(pane);
  await expect(pane).toHaveAttribute("data-active", "true");
  await waitForUiTestTitleFragment(`active=${title}`);
  return pane;
}

export async function waitForSessionSnapshotWritten(): Promise<void> {
  await waitForUiTestTitleFragment("session=written");
}

export async function waitForUiTestTitleFragment(fragment: string, timeout = 15_000): Promise<void> {
  await browser.waitUntil(async () => (await browser.getTitle()).includes(fragment), {
    interval: 250,
    timeout,
    timeoutMsg: `Crosslog UI test title did not contain: ${fragment}`,
  });
}

export function enqueueDesktopUiTestAction(action: UiTestAction): void {
  // Desktop UI tests communicate semantic actions through a temporary file so
  // the real Tauri app can execute hidden test-only workflows.
  const actionsPath = process.env.CROSSLOG_UI_TEST_ACTIONS_PATH;

  if (!actionsPath) {
    throw new Error("CROSSLOG_UI_TEST_ACTIONS_PATH must be set for Desktop UI bridge actions.");
  }

  appendFileSync(actionsPath, `${action}\n`, "utf8");
}

export async function clickElementWithJavaScript(element: WebdriverIO.Element): Promise<void> {
  await element.waitForExist();
  await browser.execute((target: HTMLElement) => target.click(), element);
}

export async function dragPaneResizeBoundary(title: string, deltaX: number): Promise<void> {
  const label = `Resize boundary after ${title}`;

  await browser.execute((boundaryLabel: string) => {
    const boundary = document.querySelector<HTMLElement>(`[aria-label="${boundaryLabel}"]`);

    if (!boundary) {
      throw new Error(`Missing ${boundaryLabel}.`);
    }

    const rect = boundary.getBoundingClientRect();

    boundary.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      pointerId: 1,
    }));
  }, label);
  await browser.pause(0);
  await browser.execute((boundaryLabel: string, dragDeltaX: number) => {
    const boundary = document.querySelector<HTMLElement>(`[aria-label="${boundaryLabel}"]`);

    if (!boundary) {
      throw new Error(`Missing ${boundaryLabel}.`);
    }

    const rect = boundary.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      clientX: startX + dragDeltaX,
      clientY: startY,
      pointerId: 1,
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      clientX: startX + dragDeltaX,
      clientY: startY,
      pointerId: 1,
    }));
  }, label, deltaX);
}

export async function expectRedesignedShellRegions(): Promise<void> {
  for (const testId of redesignedShellStructuralTestIds) {
    await expect(browser.$(byTestId(testId))).toBeExisting();
  }
}

export async function expectObsoleteControlsAbsent(): Promise<void> {
  for (const testId of redesignedShellObsoleteControlTestIds) {
    await expect(browser.$$(byTestId(testId))).toBeElementsArrayOfSize(0);
  }
}

export async function dropDesktopFileOnWorkspace(options: {
  readonly name: string;
  readonly contents: string;
  readonly relativePath?: string;
  readonly targetTestId?: RedesignedShellTestId;
}): Promise<void> {
  await browser.execute((dropOptions) => {
    const target = document.querySelector<HTMLElement>(
      `[data-testid="${dropOptions.targetTestId ?? "pane-workspace"}"]`,
    );

    if (!target) {
      throw new Error(`Missing drop target: ${dropOptions.targetTestId ?? "pane-workspace"}`);
    }

    const file = new File([dropOptions.contents], dropOptions.name);

    if (dropOptions.relativePath) {
      Object.defineProperty(file, "webkitRelativePath", {
        configurable: true,
        value: dropOptions.relativePath,
      });
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    target.dispatchEvent(new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    }));
    target.dispatchEvent(new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    }));
  }, options);
}

export function shellPresentationSearchParams(options: {
  readonly theme?: ShellThemeVariant;
  readonly platform?: ShellPlatformVariant;
} = {}): string {
  // Variant overrides are test/mockup inputs only and must not be treated as
  // product-visible selectors or persisted Desktop preferences.
  const params = new URLSearchParams();

  if (options.theme) {
    params.set("crosslog-theme", options.theme);
  }

  if (options.platform) {
    params.set("crosslog-platform", options.platform);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function setDesktopShellPresentation(options: {
  readonly theme?: ShellThemeVariant;
  readonly platform?: ShellPlatformVariant;
}): Promise<void> {
  const search = shellPresentationSearchParams(options);

  await browser.execute((nextSearch: string, eventName: string) => {
    window.history.replaceState(null, "", `${window.location.pathname}${nextSearch}`);
    window.dispatchEvent(new Event(eventName));
  }, search, shellPresentationChangeEventName);

  if (options.theme) {
    await waitForUiTestTitleFragment(`theme=${options.theme}`);
  }

  if (options.platform) {
    await waitForUiTestTitleFragment(`platform=${options.platform}`);
  }
}

export function byTestId(testId: RedesignedShellTestId): string {
  return `[data-testid="${testId}"]`;
}
