import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("applies valid pane offsets and rejects invalid offset drafts", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();

  const shell = getRedesignedShell(page);
  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({
    has: page.getByRole("heading", { name: "app.log" }),
  });
  const servicePane = page.getByTestId(redesignedShellTestIds.logPane).filter({
    has: page.getByRole("heading", { name: "service.log" }),
  });

  await appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset).click();
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetPopover)).toBeVisible();

  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("invalid");
  await expect(appPane.getByRole("alert")).toContainText("whole-number");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetApply)).toBeDisabled();
  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("0 ms");

  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("1");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetApply).click();

  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("+1m");
  await expect(servicePane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("0 ms");
  await expect(shell.timeOffsetPopover).toHaveCount(0);

  await appPane.locator('[data-line-number="1"]').click();
  await expect(servicePane.locator('[data-line-number="61"]')).toHaveAttribute("data-sync-target", "true");
});
