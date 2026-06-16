import { expect, test } from "@playwright/test";

test("synchronizes timestamped panes and supports disabling synchronization", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();

  const syncToggle = page.getByLabel("Synchronize by time");
  await expect(syncToggle).toBeChecked();

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });

  await appPane.locator('[data-line-number="3"]').click();
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "true");

  await syncToggle.setChecked(false);
  await appPane.locator('[data-line-number="4"]').click();
  await expect(servicePane.locator('[data-line-number="3"]')).toHaveAttribute("data-sync-target", "false");
});
