import { expect, test } from "@playwright/test";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("opens and manages multiple log panes", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.commandField).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.statusBar).toContainText("0 panes");

  await page.getByRole("button", { name: "Open logs" }).click();

  await expect(shell.paneWorkspace).toBeVisible();
  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "service.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
  await expect(shell.statusBar).toContainText("3 panes");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-16.log");

  await page.getByTestId("topbar-add-pane").click();
  await expect(shell.logPanes).toHaveCount(4);

  await page.getByRole("button", { name: "Split active pane" }).click();
  await expect(shell.logPanes).toHaveCount(5);

  await page.getByRole("button", { name: "Move boundary after app.log right" }).click();
  await page.getByRole("button", { name: "Close pane service.log" }).click();
  await expect(shell.logPanes).toHaveCount(4);

  await shell.paneWorkspace.evaluate((element) => {
    element.scrollLeft = 120;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(shell.paneWorkspace).toHaveJSProperty("scrollLeft", 120);
  await expect(shell.workspaceScrollbar).toBeVisible();

  const scroller = page.getByRole("region", { name: "Horizontal log scroller for app.log" });
  await scroller.evaluate((element) => {
    element.scrollLeft = 120;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(scroller).toHaveJSProperty("scrollLeft", 120);
});
