import { expect, test } from "@playwright/test";

test("copies selected log text from a pane", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();
  await page.getByRole("button", { name: "Copy selected text from app.log" }).click();

  await expect(page.getByRole("status", { name: "Copied app.log" })).toBeVisible();
});
