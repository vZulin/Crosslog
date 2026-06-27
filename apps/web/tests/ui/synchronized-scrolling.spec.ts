import { expect, test } from "@playwright/test";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("synchronizes timestamped panes and supports disabling synchronization", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();

  const shell = getRedesignedShell(page);
  const syncToggle = shell.topbar.getByLabel("Synchronize by time");
  await expect(syncToggle).toBeChecked();
  await expect(shell.topbar).toContainText("Sync on");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-16.log");

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });

  await appPane.locator('[data-line-number="3"]').click();
  await expect(appPane.getByTestId("pane-header")).toHaveAttribute("aria-current", "true");
  await expect(shell.statusBar).toContainText("Active: app.log");
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "true");

  await syncToggle.setChecked(false);
  await expect(shell.topbar).toContainText("Sync off");
  await expect(shell.statusBar).toContainText("Sync off");
  await appPane.locator('[data-line-number="4"]').click();
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "false");
});
