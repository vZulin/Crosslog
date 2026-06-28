import { expect, type Locator, type Page } from "@playwright/test";
import {
  redesignedShellStructuralTestIds,
  redesignedShellObsoleteControlTestIds,
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "@crosslog/ui";

export type ShellThemeVariant = "light" | "dark";
export type ShellPlatformVariant = "macos" | "windows" | "linux" | "web";

export interface RedesignedShellLocators {
  readonly shell: Locator;
  readonly topbar: Locator;
  readonly commandField: Locator;
  readonly topbarSync: Locator;
  readonly topbarAddPane: Locator;
  readonly themeVariant: Locator;
  readonly platformChrome: Locator;
  readonly activityRail: Locator;
  readonly emptyWorkspace: Locator;
  readonly emptyDropZone: Locator;
  readonly emptyOpenSource: Locator;
  readonly paneWorkspace: Locator;
  readonly paneResizeBoundaries: Locator;
  readonly workspaceScrollbar: Locator;
  readonly logPanes: Locator;
  readonly paneSearchPopover: Locator;
  readonly timeOffsetPopover: Locator;
  readonly statusBar: Locator;
  readonly obsoleteControls: readonly Locator[];
}

export function getRedesignedShell(page: Page): RedesignedShellLocators {
  return {
    shell: byTestId(page, redesignedShellTestIds.crosslogShell),
    topbar: byTestId(page, redesignedShellTestIds.topbar),
    commandField: byTestId(page, redesignedShellTestIds.commandField),
    topbarSync: byTestId(page, redesignedShellTestIds.topbarSync),
    topbarAddPane: byTestId(page, redesignedShellTestIds.topbarAddPane),
    themeVariant: byTestId(page, redesignedShellTestIds.themeVariant),
    platformChrome: byTestId(page, redesignedShellTestIds.platformChrome),
    activityRail: byTestId(page, redesignedShellTestIds.activityRail),
    emptyWorkspace: byTestId(page, redesignedShellTestIds.emptyWorkspace),
    emptyDropZone: byTestId(page, redesignedShellTestIds.emptyDropZone),
    emptyOpenSource: byTestId(page, redesignedShellTestIds.emptyOpenSource),
    paneWorkspace: byTestId(page, redesignedShellTestIds.paneWorkspace),
    paneResizeBoundaries: byTestId(page, redesignedShellTestIds.paneResizeBoundary),
    workspaceScrollbar: byTestId(page, redesignedShellTestIds.workspaceScrollbar),
    logPanes: byTestId(page, redesignedShellTestIds.logPane),
    paneSearchPopover: byTestId(page, redesignedShellTestIds.paneSearchPopover),
    timeOffsetPopover: byTestId(page, redesignedShellTestIds.timeOffsetPopover),
    statusBar: byTestId(page, redesignedShellTestIds.statusBar),
    obsoleteControls: redesignedShellObsoleteControlTestIds.map((testId) => byTestId(page, testId)),
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

export async function expectObsoleteControlsAbsent(page: Page): Promise<void> {
  for (const testId of redesignedShellObsoleteControlTestIds) {
    await expect(byTestId(page, testId)).toHaveCount(0);
  }
}

export function shellPresentationUrl(
  baseUrl: string,
  options: {
    readonly theme?: ShellThemeVariant;
    readonly platform?: ShellPlatformVariant;
  } = {},
): string {
  const url = new URL(baseUrl, "http://localhost");

  if (options.theme) {
    url.searchParams.set("crosslog-theme", options.theme);
  }

  if (options.platform) {
    url.searchParams.set("crosslog-platform", options.platform);
  }

  return `${url.pathname}${url.search}`;
}
