import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("synchronizes timestamped panes and supports disabling synchronization", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();

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

  await syncToggle.click();
  await expect(syncToggle).toHaveAttribute("aria-pressed", "false");
  await expect(shell.topbar).not.toContainText("Sync off");
  await expect(shell.statusBar).toContainText("Sync off");
  await appPane.locator('[data-line-number="4"]').click();
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "false");
});
