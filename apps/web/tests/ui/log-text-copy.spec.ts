import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";

test("copies selected log text from a pane", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();

  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({ hasText: "app.log" }).first();

  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeader)).toBeVisible();
  await appPane.getByRole("group", { name: "Log text actions for app.log" }).click({ button: "right" });
  await appPane.getByRole("menuitem", { name: "Copy selected text" }).click();

  await expect(appPane.getByRole("status", { name: "Copied app.log" })).toBeVisible();
});
