import { expect, type Locator, type Page } from "@playwright/test";
import type { UiTestAction } from "@crosslog/platform";
import {
  redesignedShellStructuralTestIds,
  redesignedShellObsoleteControlTestIds,
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "@crosslog/ui";

export type ShellThemeVariant = "light" | "dark";
export type ShellPlatformVariant = "macos" | "windows" | "linux" | "web";

/**
 * Shared Web shell selectors for the 003 design alignment.
 *
 * Prefer these stable `data-testid` locators for shell structure, obsolete
 * control absence, theme variants, platform chrome, and pane resize boundaries.
 * Do not assert removed product labels such as `Split`, `Sync on`, or
 * `Synchronize by time`; those labels are intentionally absent from the aligned
 * shell.
 */
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
    readonly uiTestBridge?: boolean;
  } = {},
): string {
  // Variant overrides are test/mockup inputs only; they must not imply product
  // UI selectors or persisted user preferences.
  const url = new URL(baseUrl, "http://localhost");

  if (options.theme) {
    url.searchParams.set("crosslog-theme", options.theme);
  }

  if (options.platform) {
    url.searchParams.set("crosslog-platform", options.platform);
  }

  if (options.uiTestBridge) {
    url.searchParams.set("crosslog-ui-test", "1");
  }

  return `${url.pathname}${url.search}`;
}

export async function gotoWithWebUiTestBridge(page: Page, baseUrl = "/"): Promise<void> {
  // The bridge exposes lifecycle and source setup actions that replaced the
  // removed workspace test-action toolbar in product UI.
  await page.goto(shellPresentationUrl(baseUrl, { uiTestBridge: true }));
  await waitForWebUiTestTitleFragment(page, "state=");
}

export async function enqueueWebUiTestAction(page: Page, action: UiTestAction): Promise<void> {
  await page.evaluate((queuedAction) => {
    window.__crosslogUiTestActions ??= [];
    window.__crosslogUiTestActions.push(queuedAction);
  }, action);
}

export async function waitForWebUiTestTitleFragment(
  page: Page,
  fragment: string,
  timeout = 10_000,
): Promise<void> {
  await page.waitForFunction(
    (expectedFragment) => document.title.includes(expectedFragment),
    fragment,
    { timeout },
  );
}
