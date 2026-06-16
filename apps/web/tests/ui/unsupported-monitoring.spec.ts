import { expect, test } from "@playwright/test";

test("shows unsupported local monitoring messaging in the browser", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toBeVisible();
  await page.getByRole("button", { name: "Open logs" }).click();
  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toBeVisible();
});
