import { appendFileSync } from "node:fs";
import { browser, expect } from "@wdio/globals";
import {
  redesignedShellStructuralTestIds,
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "@crosslog/ui";

export function redesignedShellSelectors() {
  return {
    shell: byTestId(redesignedShellTestIds.crosslogShell),
    topbar: byTestId(redesignedShellTestIds.topbar),
    commandField: byTestId(redesignedShellTestIds.commandField),
    activityRail: byTestId(redesignedShellTestIds.activityRail),
    paneWorkspace: byTestId(redesignedShellTestIds.paneWorkspace),
    workspaceScrollbar: byTestId(redesignedShellTestIds.workspaceScrollbar),
    logPane: byTestId(redesignedShellTestIds.logPane),
    paneSearchPopover: byTestId(redesignedShellTestIds.paneSearchPopover),
    timeOffsetPopover: byTestId(redesignedShellTestIds.timeOffsetPopover),
    statusBar: byTestId(redesignedShellTestIds.statusBar),
  };
}

export function getRedesignedShell() {
  const selectors = redesignedShellSelectors();

  return {
    shell: browser.$(selectors.shell),
    topbar: browser.$(selectors.topbar),
    commandField: browser.$(selectors.commandField),
    activityRail: browser.$(selectors.activityRail),
    paneWorkspace: browser.$(selectors.paneWorkspace),
    workspaceScrollbar: browser.$(selectors.workspaceScrollbar),
    logPanes: browser.$$(selectors.logPane),
    paneSearchPopover: browser.$(selectors.paneSearchPopover),
    timeOffsetPopover: browser.$(selectors.timeOffsetPopover),
    statusBar: browser.$(selectors.statusBar),
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
    | "navigatePreviousDirectoryFile"
    | "navigateNextDirectoryFile"
    | "discoverNewerDirectoryFile",
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

export function byTestId(testId: RedesignedShellTestId): string {
  return `[data-testid="${testId}"]`;
}
