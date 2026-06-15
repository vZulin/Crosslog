import { expect, test } from "@playwright/test";

test("manual encoding UI is reserved for source loading flows", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open logs" })).toBeVisible();
});

