import { expect, test } from "@playwright/test";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("hides browser local-monitoring warnings without exposing live-file controls", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Append live line" })).toHaveCount(0);
});
