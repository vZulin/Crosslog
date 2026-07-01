import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  expectObsoleteControlsAbsent,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
} from "./helpers/redesigned-shell";

test("copies selected log text from a pane", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({ hasText: "app.log" }).first();

  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeader)).toBeVisible();
  await expectObsoleteControlsAbsent(page);
  await expect(appPane.locator(".crosslog-pane-tools")).toHaveCount(0);
  await expect(appPane.locator(".crosslog-log-text-selection__copy")).toHaveCount(0);

  const textActions = appPane.getByRole("group", { name: "Log text actions for app.log" });
  const actionsBox = await textActions.boundingBox();
  expect(actionsBox).not.toBeNull();

  if (!actionsBox) {
    return;
  }

  const firstPointer = { x: actionsBox.x + 160, y: actionsBox.y + 54 };
  await page.mouse.click(firstPointer.x, firstPointer.y, { button: "right" });

  const copyAction = appPane.getByRole("menuitem", { name: "Copy selected text" });
  await expect(copyAction).toBeVisible();
  const firstActionBox = await copyAction.boundingBox();
  expect(firstActionBox).not.toBeNull();

  if (!firstActionBox) {
    return;
  }

  expect(Math.abs(firstActionBox.x - firstPointer.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstActionBox.y - firstPointer.y)).toBeLessThanOrEqual(2);

  const edgePointer = { x: actionsBox.x + actionsBox.width - 2, y: actionsBox.y + actionsBox.height - 2 };
  await page.mouse.click(edgePointer.x, edgePointer.y, { button: "right" });
  const edgeActionBox = await copyAction.boundingBox();
  expect(edgeActionBox).not.toBeNull();

  if (!edgeActionBox) {
    return;
  }

  expect(edgeActionBox.x + edgeActionBox.width).toBeLessThanOrEqual(actionsBox.x + actionsBox.width + 1);
  expect(edgeActionBox.y + edgeActionBox.height).toBeLessThanOrEqual(actionsBox.y + actionsBox.height + 1);

  await page.mouse.click(actionsBox.x + 8, actionsBox.y + 8);
  await expect(copyAction).toHaveCount(0);

  await page.mouse.click(firstPointer.x, firstPointer.y, { button: "right" });
  await appPane.getByRole("menuitem", { name: "Copy selected text" }).click();

  await expect(appPane.getByRole("status", { name: /Copied/i })).toHaveCount(0);
  await expect(appPane.getByText("Copied", { exact: true })).toHaveCount(0);
});
