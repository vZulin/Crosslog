import { expect, test } from "@playwright/test";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("manual encoding UI is reserved for source loading flows", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.statusBar).toContainText("0 panes");
  await expect(page.getByRole("button", { name: "Open logs" })).toBeVisible();
  await expect(page.getByLabel("Open browser files")).toBeAttached();
});
