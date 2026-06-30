import { expect, test, type Locator } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
} from "./helpers/redesigned-shell";

test("applies valid pane offsets and rejects invalid offset drafts", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

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
  await expectCompactPopoverInsidePane(appPane, appOffsetPopover, 120);
  await expectMockupTimeOffsetPopover(appOffsetPopover, "app.log");
  await expect(appOffsetPopover.getByRole("button", { name: /Close time offset/u })).toHaveCount(0);

  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("invalid");
  await expect(appPane.getByRole("alert")).toContainText("Minutes must be a whole number");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes)).toHaveAttribute("aria-invalid", "true");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetApply)).toBeDisabled();

  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("60");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetHours).fill("24");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetSeconds).fill("60");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMilliseconds).fill("1000");
  await expect(appPane.getByRole("alert")).toContainText("Hours must be 0-23");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetHours)).toHaveAttribute("aria-invalid", "true");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes)).toHaveAttribute("aria-invalid", "true");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetSeconds)).toHaveAttribute("aria-invalid", "true");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetMilliseconds)).toHaveAttribute("aria-invalid", "true");
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetApply)).toBeDisabled();
  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("0 ms");

  await appPane.getByTestId(redesignedShellTestIds.timeOffsetDays).fill("123456");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetHours).fill("23");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("59");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetSeconds).fill("59");
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetMilliseconds).fill("999");
  await expect(appPane.getByRole("alert")).toHaveCount(0);
  await expect(appPane.getByTestId(redesignedShellTestIds.timeOffsetApply)).toBeEnabled();

  for (const testId of [
    redesignedShellTestIds.timeOffsetDays,
    redesignedShellTestIds.timeOffsetHours,
    redesignedShellTestIds.timeOffsetMinutes,
    redesignedShellTestIds.timeOffsetSeconds,
    redesignedShellTestIds.timeOffsetMilliseconds,
  ]) {
    await appPane.getByTestId(testId).fill("");
    await expect(appPane.getByTestId(testId)).not.toHaveAttribute("aria-invalid", "true");
  }
  await expect(appPane.getByRole("alert")).toHaveCount(0);
  await appPane.getByTestId(redesignedShellTestIds.timeOffsetApply).click();
  await expect(appOffsetPopover).toHaveCount(0);
  await expect(appPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("0 ms");

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
  await expectCompactPopoverInsidePane(servicePane, serviceOffsetPopover, 120);
  await expectMockupTimeOffsetPopover(serviceOffsetPopover, "service.log");

  await directoryPane.getByTestId(redesignedShellTestIds.paneHeaderOffset).click();
  const directoryOffsetPopover = directoryPane.getByTestId(redesignedShellTestIds.timeOffsetPopover);
  await expect(directoryOffsetPopover).toBeVisible();
  await expectCompactPopoverInsidePane(directoryPane, directoryOffsetPopover, 120);
  await expectMockupTimeOffsetPopover(directoryOffsetPopover, "app-2026-06-16.log");
  await expect(servicePane.getByTestId(redesignedShellTestIds.timeOffsetPopover)).toHaveCount(0);
});

async function expectMockupTimeOffsetPopover(popover: Locator, sourceName: string): Promise<void> {
  await expect(popover.getByRole("heading", { name: "Time Offset" })).toBeVisible();
  await expect(popover.locator(".crosslog-time-offset-popover__source")).toHaveText(sourceName);
  await expect(popover.locator(".crosslog-time-offset-popover__field-label")).toHaveText([
    "Days",
    "Hours",
    "Min",
    "Sec",
    "Ms",
  ]);

  const metrics = await popover.evaluate((element) => {
    const rectOf = (selector: string) => {
      const target = element.querySelector<HTMLElement>(selector);

      if (!target) {
        throw new Error(`Missing selector in time offset popover: ${selector}`);
      }

      const rect = target.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };

    const popoverRect = element.getBoundingClientRect();
    const inputs = Array.from(element.querySelectorAll<HTMLInputElement>(".crosslog-time-offset-popover__field input"))
      .map((input) => {
        const rect = input.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      });

    return {
      popover: {
        width: popoverRect.width,
        height: popoverRect.height,
      },
      titleIcon: rectOf(".crosslog-time-offset-popover__title-icon"),
      title: rectOf(".crosslog-time-offset-popover__title"),
      source: rectOf(".crosslog-time-offset-popover__source"),
      inputs,
      apply: rectOf(".crosslog-time-offset-popover__apply"),
    };
  });

  expect(metrics.popover.width).toBeGreaterThanOrEqual(300);
  expect(metrics.popover.width).toBeLessThanOrEqual(304);
  expect(metrics.popover.height).toBeGreaterThanOrEqual(113);
  expect(metrics.popover.height).toBeLessThanOrEqual(116);
  expect(metrics.inputs).toHaveLength(5);

  for (const input of metrics.inputs) {
    expect(input.width).toBeGreaterThanOrEqual(49);
    expect(input.width).toBeLessThanOrEqual(52);
    expect(input.height).toBeGreaterThanOrEqual(24);
    expect(input.height).toBeLessThanOrEqual(27);
  }

  expect(metrics.titleIcon.left).toBeLessThan(metrics.title.left);
  expect(metrics.title.right).toBeLessThan(metrics.source.left);
  expect(metrics.inputs[0]!.top).toBeGreaterThan(metrics.title.bottom);
  expect(metrics.apply.top).toBeGreaterThan(metrics.inputs[0]!.bottom);
  expect(Math.abs(metrics.apply.right - metrics.inputs[4]!.right)).toBeLessThanOrEqual(1);
}

async function expectCompactPopoverInsidePane(
  pane: Locator,
  popover: Locator,
  maxHeight: number,
): Promise<void> {
  const paneBox = await pane.boundingBox();
  const paneHeaderBox = await pane.getByTestId(redesignedShellTestIds.paneHeader).boundingBox();
  const popoverBox = await popover.boundingBox();

  expect(paneBox, "pane bounds").not.toBeNull();
  expect(paneHeaderBox, "pane header bounds").not.toBeNull();
  expect(popoverBox, "popover bounds").not.toBeNull();

  if (!paneBox || !paneHeaderBox || !popoverBox) {
    return;
  }

  expect(popoverBox.x).toBeGreaterThanOrEqual(paneBox.x - 1);
  expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(paneBox.x + paneBox.width + 1);
  expect(popoverBox.y).toBeGreaterThanOrEqual(paneHeaderBox.y + paneHeaderBox.height - 1);
  expect(popoverBox.height).toBeLessThan(maxHeight);
}
