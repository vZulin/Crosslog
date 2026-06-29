import { expect, test, type Locator } from "@playwright/test";
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
  const directoryPane = page.getByTestId(redesignedShellTestIds.logPane).filter({
    has: page.getByRole("heading", { name: "app-2026-06-16.log" }),
  });
  const appOffsetTag = appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset);

  await appOffsetTag.click();
  const appOffsetPopover = appPane.getByTestId(redesignedShellTestIds.timeOffsetPopover);
  await expect(appOffsetPopover).toBeVisible();
  await expectCompactPopoverInsidePane(appPane, appOffsetPopover, 100);
  await expect(appOffsetPopover.getByRole("button", { name: /Close time offset/u })).toHaveCount(0);

  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("invalid");
  await expect(appPane.getByRole("alert")).toContainText("whole-number");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetApply)).toBeDisabled();
  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("0 ms");
  await page.keyboard.press("Escape");
  await expect(appOffsetPopover).toHaveCount(0);
  await expect(appOffsetTag).toBeFocused();

  await appOffsetTag.click();
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("1");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetApply).click();

  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("+1m");
  await expect(servicePane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("0 ms");
  await expect(shell.timeOffsetPopover).toHaveCount(0);

  await appPane.locator('[data-line-number="1"]').click();
  await expect(servicePane.locator('[data-line-number="61"]')).toHaveAttribute("data-sync-target", "true");

  await servicePane.getByTestId(redesignedShellTestIds.paneHeaderOffset).click();
  const serviceOffsetPopover = servicePane.getByTestId(redesignedShellTestIds.timeOffsetPopover);
  await expect(serviceOffsetPopover).toBeVisible();
  await expectCompactPopoverInsidePane(servicePane, serviceOffsetPopover, 100);

  await directoryPane.getByTestId(redesignedShellTestIds.paneHeaderOffset).click();
  const directoryOffsetPopover = directoryPane.getByTestId(redesignedShellTestIds.timeOffsetPopover);
  await expect(directoryOffsetPopover).toBeVisible();
  await expectCompactPopoverInsidePane(directoryPane, directoryOffsetPopover, 100);
  await expect(servicePane.getByTestId(redesignedShellTestIds.timeOffsetPopover)).toHaveCount(0);
});

async function expectCompactPopoverInsidePane(
  pane: Locator,
  popover: Locator,
  maxHeight: number,
): Promise<void> {
  const paneBox = await pane.boundingBox();
  const popoverBox = await popover.boundingBox();

  expect(paneBox, "pane bounds").not.toBeNull();
  expect(popoverBox, "popover bounds").not.toBeNull();

  if (!paneBox || !popoverBox) {
    return;
  }

  expect(popoverBox.x).toBeGreaterThanOrEqual(paneBox.x - 1);
  expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(paneBox.x + paneBox.width + 1);
  expect(popoverBox.height).toBeLessThan(maxHeight);
}
