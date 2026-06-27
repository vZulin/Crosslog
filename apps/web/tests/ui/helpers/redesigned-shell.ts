import { expect, type Locator, type Page } from "@playwright/test";
import {
  redesignedShellStructuralTestIds,
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "@crosslog/ui";

export interface RedesignedShellLocators {
  readonly shell: Locator;
  readonly topbar: Locator;
  readonly commandField: Locator;
  readonly activityRail: Locator;
  readonly paneWorkspace: Locator;
  readonly workspaceScrollbar: Locator;
  readonly logPanes: Locator;
  readonly paneSearchPopover: Locator;
  readonly timeOffsetPopover: Locator;
  readonly statusBar: Locator;
}

export function getRedesignedShell(page: Page): RedesignedShellLocators {
  return {
    shell: byTestId(page, redesignedShellTestIds.crosslogShell),
    topbar: byTestId(page, redesignedShellTestIds.topbar),
    commandField: byTestId(page, redesignedShellTestIds.commandField),
    activityRail: byTestId(page, redesignedShellTestIds.activityRail),
    paneWorkspace: byTestId(page, redesignedShellTestIds.paneWorkspace),
    workspaceScrollbar: byTestId(page, redesignedShellTestIds.workspaceScrollbar),
    logPanes: byTestId(page, redesignedShellTestIds.logPane),
    paneSearchPopover: byTestId(page, redesignedShellTestIds.paneSearchPopover),
    timeOffsetPopover: byTestId(page, redesignedShellTestIds.timeOffsetPopover),
    statusBar: byTestId(page, redesignedShellTestIds.statusBar),
  };
}

export async function expectRedesignedShellRegions(page: Page): Promise<void> {
  for (const testId of redesignedShellStructuralTestIds) {
    await expect(byTestId(page, testId).first()).toBeVisible();
  }
}

export function byTestId(page: Page, testId: RedesignedShellTestId): Locator {
  return page.getByTestId(testId);
}
