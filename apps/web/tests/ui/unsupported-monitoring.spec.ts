import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";

test("shows unsupported local monitoring messaging in the browser", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toBeVisible();
  await page.getByRole("button", { name: "Open logs" }).click();
  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toBeVisible();

  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({ hasText: "app.log" }).first();
  const appHeader = appPane.getByTestId(redesignedShellTestIds.paneHeader);

  await expect(appHeader.getByTestId(redesignedShellTestIds.paneHeaderMonitoringUnsupported)).toHaveText(
    "Monitoring unavailable",
  );
  await expect(appHeader.getByRole("status", { name: "File state for app.log: Monitoring unavailable" })).toBeVisible();
});
