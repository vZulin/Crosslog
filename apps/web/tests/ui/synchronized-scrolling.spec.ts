import { expect, test } from "@playwright/test";
import {
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

test("synchronizes timestamped panes and supports disabling synchronization", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const shell = getRedesignedShell(page);
  const syncToggle = shell.topbar.getByRole("button", { name: "Toggle time synchronization" });
  await expect(syncToggle).toHaveAttribute("aria-pressed", "true");
  await expect(shell.topbar).not.toContainText("Sync on");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-16.log");

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });

  await appPane.locator('[data-line-number="3"]').click();
  await expect(appPane.getByTestId("pane-header")).toHaveAttribute("aria-current", "true");
  await expect(shell.statusBar).toContainText("Active: app.log");
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "true");
  await waitForWebUiTestTitleFragment(page, "lastNavigation=click");

  const appViewport = appPane.getByTestId("log-viewport");
  await appViewport.focus();
  await page.keyboard.press("ArrowDown");
  await expect(appViewport).toHaveAttribute("data-selected-line-number", "4");
  await expect(servicePane.locator('[data-line-number="4"]')).toHaveAttribute("data-sync-target", "true");
  await waitForWebUiTestTitleFragment(page, "lastNavigation=keyboard");
  await waitForWebUiTestTitleFragment(page, "syncTargetLine=4");

  await appViewport.dispatchEvent("wheel", { deltaY: 120 });
  await expect(appViewport).toHaveAttribute("data-last-navigation", "wheel");
  await expect(servicePane.locator('[data-line-number="7"]')).toHaveAttribute("data-sync-target", "true");
  await waitForWebUiTestTitleFragment(page, "syncTargetLine=7");

  await syncToggle.click();
  await expect(syncToggle).toHaveAttribute("aria-pressed", "false");
  await expect(shell.topbar).not.toContainText("Sync off");
  await expect(shell.statusBar).toContainText("Sync off");
  await appPane.locator('[data-line-number="4"]').click();
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "false");
});
