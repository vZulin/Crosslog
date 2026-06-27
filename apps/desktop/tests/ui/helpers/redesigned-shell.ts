import { browser, expect } from "@wdio/globals";
import {
  redesignedShellStructuralTestIds,
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "@crosslog/ui/app-shell/testIds";

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
  const shellSelector = byTestId(redesignedShellTestIds.crosslogShell);

  await browser.waitUntil(async () => browser.$(shellSelector).isExisting(), {
    interval: 250,
    timeout: 20_000,
    timeoutMsg: `Crosslog shell did not mount: ${shellSelector}`,
  });
}

export async function expectRedesignedShellRegions(): Promise<void> {
  for (const testId of redesignedShellStructuralTestIds) {
    await expect(browser.$(byTestId(testId))).toBeExisting();
  }
}

export function byTestId(testId: RedesignedShellTestId): string {
  return `[data-testid="${testId}"]`;
}
