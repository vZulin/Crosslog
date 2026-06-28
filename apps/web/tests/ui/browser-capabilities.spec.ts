import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("shows browser capability limits without promising local monitoring", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(page.getByTestId(redesignedShellTestIds.capabilityLimitations)).toContainText(
    "Browser sessions cannot monitor local filesystem changes.",
  );
  await expect(page.getByRole("button", { name: "Append live line" })).toHaveCount(0);
});
