import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  enqueueWebUiTestAction,
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

test.describe("settings and theme workflow", () => {
  test("defaults to System, follows live system changes, and preserves analysis state", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoWithWebUiTestBridge(page);

    const shell = getRedesignedShell(page);
    await expect(shell.shell).toHaveAttribute("data-theme", "dark");
    await waitForWebUiTestTitleFragment(page, "themePreference=system");
    await waitForWebUiTestTitleFragment(page, "theme=dark");

    await page.getByRole("button", { name: "Settings" }).click();
    await expect(shell.settingsSurface).toBeVisible();
    await expect(shell.settingsThemeSystem).toBeChecked();
    await waitForWebUiTestTitleFragment(page, "settingsSurface=open");

    await page.getByText("Light", { exact: true }).click();
    await expect(shell.settingsThemeLight).toBeChecked();
    await expect(shell.shell).toHaveAttribute("data-theme", "light");
    await waitForWebUiTestTitleFragment(page, "themePreference=light");

    await openSampleLogsWithWebUiBridge(page);
    await enqueueWebUiTestAction(page, "openActivePaneSearch");
    await waitForWebUiTestTitleFragment(page, "search=open");
    await enqueueWebUiTestAction(page, "toggleSynchronization");
    await waitForWebUiTestTitleFragment(page, "sync=off");

    await page.getByText("Dark", { exact: true }).click();
    await expect(shell.settingsThemeDark).toBeChecked();
    await expect(shell.shell).toHaveAttribute("data-theme", "dark");
    await expect(page.getByTestId(redesignedShellTestIds.logPane)).toHaveCount(3);
    await waitForWebUiTestTitleFragment(page, "search=open");
    await waitForWebUiTestTitleFragment(page, "sync=off");
    await waitForWebUiTestTitleFragment(page, "syncVisual=inactive");
    await waitForWebUiTestTitleFragment(page, "syncPressed=off");

    await page.getByText("System", { exact: true }).click();
    await expect(shell.settingsThemeSystem).toBeChecked();
    await expect(shell.shell).toHaveAttribute("data-theme", "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(shell.shell).toHaveAttribute("data-theme", "light");
    await waitForWebUiTestTitleFragment(page, "themePreference=system");
    await waitForWebUiTestTitleFragment(page, "theme=light");
    await waitForWebUiTestTitleFragment(page, "panes=3");
    await waitForWebUiTestTitleFragment(page, "search=open");
    await waitForWebUiTestTitleFragment(page, "sync=off");
  });
});
