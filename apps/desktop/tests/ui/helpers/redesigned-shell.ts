import { appendFileSync } from "node:fs";
import { browser, expect } from "@wdio/globals";
import {
  redesignedShellObsoleteControlTestIds,
  redesignedShellStructuralTestIds,
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "@crosslog/ui";

export type ShellThemeVariant = "light" | "dark";
export type ShellPlatformVariant = "macos" | "windows" | "linux" | "web";

export function redesignedShellSelectors() {
  return {
    shell: byTestId(redesignedShellTestIds.crosslogShell),
    topbar: byTestId(redesignedShellTestIds.topbar),
    commandField: byTestId(redesignedShellTestIds.commandField),
    topbarSync: byTestId(redesignedShellTestIds.topbarSync),
    topbarAddPane: byTestId(redesignedShellTestIds.topbarAddPane),
    themeVariant: byTestId(redesignedShellTestIds.themeVariant),
    platformChrome: byTestId(redesignedShellTestIds.platformChrome),
    activityRail: byTestId(redesignedShellTestIds.activityRail),
    emptyWorkspace: byTestId(redesignedShellTestIds.emptyWorkspace),
    emptyDropZone: byTestId(redesignedShellTestIds.emptyDropZone),
    emptyOpenSource: byTestId(redesignedShellTestIds.emptyOpenSource),
    paneWorkspace: byTestId(redesignedShellTestIds.paneWorkspace),
    paneResizeBoundary: byTestId(redesignedShellTestIds.paneResizeBoundary),
    workspaceScrollbar: byTestId(redesignedShellTestIds.workspaceScrollbar),
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
    themeVariant: browser.$(selectors.themeVariant),
    platformChrome: browser.$(selectors.platformChrome),
    activityRail: browser.$(selectors.activityRail),
    emptyWorkspace: browser.$(selectors.emptyWorkspace),
    emptyDropZone: browser.$(selectors.emptyDropZone),
    emptyOpenSource: browser.$(selectors.emptyOpenSource),
    paneWorkspace: browser.$(selectors.paneWorkspace),
    paneResizeBoundaries: browser.$$(selectors.paneResizeBoundary),
    workspaceScrollbar: browser.$(selectors.workspaceScrollbar),
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
    timeout: 20_000,
    timeoutMsg: `Crosslog desktop workspace did not mount: ${workspaceSelector}`,
  });
}

export async function openSampleLogsWithUiBridge(): Promise<void> {
  enqueueDesktopUiTestAction("openSampleLogs");
  await waitForUiTestTitleFragment("state=logs");
  await waitForUiTestTitleFragment("panes=3");
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

export function enqueueDesktopUiTestAction(
  action:
    | "openSampleLogs"
    | "copyFirstPane"
    | "toggleSynchronization"
    | "openActivePaneSearch"
    | "setActivePaneInvalidSearch"
    | "openEmptyDirectory"
    | "navigatePreviousDirectoryFile"
    | "navigateNextDirectoryFile"
    | "discoverNewerDirectoryFile"
    | "openActivePaneTimeOffset"
    | "setActivePaneTimeOffset"
    | "appendActiveFile"
    | "deleteActiveFile"
    | "replaceActiveFile",
): void {
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

export function shellPresentationSearchParams(options: {
  readonly theme?: ShellThemeVariant;
  readonly platform?: ShellPlatformVariant;
} = {}): string {
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

export function byTestId(testId: RedesignedShellTestId): string {
  return `[data-testid="${testId}"]`;
}
