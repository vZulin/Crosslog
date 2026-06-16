import { expect, test } from "@playwright/test";

test("shows browser capability limits without promising local monitoring", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Append live line" })).toHaveCount(0);
});
