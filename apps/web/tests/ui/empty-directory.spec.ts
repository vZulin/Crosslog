import { expect, test } from "@playwright/test";

test("shows empty-directory status for directories without top-level files", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open empty directory" }).click();

  await expect(page.getByRole("status", { name: "Empty directory logs/2026" })).toHaveText(
    "No top-level log files in logs/2026",
  );
  await expect(page.getByRole("button", { name: "Previous file in logs/2026" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next file in logs/2026" })).toHaveCount(0);
});
