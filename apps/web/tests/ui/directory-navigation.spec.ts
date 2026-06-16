import { expect, test } from "@playwright/test";

test("navigates directory files without auto-switching on refresh", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();

  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
  await expect(page.getByText("logs/2026 / app-2026-06-16.log")).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous file in logs/2026" })).toBeDisabled();

  await page.getByRole("button", { name: "Next file in logs/2026" }).click();
  await expect(page.getByRole("heading", { name: "app-2026-06-15.log" })).toBeVisible();

  await page.getByRole("button", { name: "Previous file in logs/2026" }).click();
  await page.getByRole("button", { name: "Discover newer directory file" }).click();

  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous file in logs/2026" })).toBeEnabled();

  await page.getByRole("button", { name: "Previous file in logs/2026" }).click();
  await expect(page.getByRole("heading", { name: "app-2026-06-17.log" })).toBeVisible();
});
