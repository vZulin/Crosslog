import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  enqueueDesktopUiTestAction,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop time offset popover", () => {
  it("applies valid pane offsets and preserves synchronized line targeting", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const panes = await $$(byTestId(redesignedShellTestIds.logPane));
    const appPane = panes[0]!;
    const servicePane = panes[1]!;
    const directoryPane = panes[2]!;
    const appOffsetTag = await appPane.$(byTestId(redesignedShellTestIds.paneHeaderOffset));

    await clickElementWithJavaScript(appOffsetTag);
    const appOffsetPopover = await appPane.$(byTestId(redesignedShellTestIds.timeOffsetPopover));
    const appOffsetMinutes = await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMinutes));
    await expect(appOffsetPopover).toBeExisting();
    await expectCompactPopoverInsidePane(appPane, appOffsetPopover, 120);
    await expectMockupTimeOffsetPopover(appOffsetPopover, "app.log");
    await expect(appOffsetMinutes).toBeExisting();
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply))).toBeExisting();
    await expect(await appOffsetPopover.$$('[aria-label^="Close time offset"]')).toBeElementsArrayOfSize(0);
    expect(await appOffsetTag.getAttribute("aria-label")).toContain("0 ms");

    await setInputValue(appOffsetMinutes, "invalid");
    await expect(await appOffsetPopover.$('[role="alert"]')).toHaveText(expect.stringContaining("whole-number"));
    const appOffsetApply = await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply));

    expect(await appOffsetApply.getAttribute("disabled")).not.toBeNull();
    await pressEscapeInElement(appOffsetMinutes);
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeElementsArrayOfSize(0);
    expect(await isFocused(appOffsetTag)).toBe(true);

    enqueueDesktopUiTestAction("setActivePaneTimeOffset");
    await waitForUiTestTitleFragment("activeOffset=+1m");

    expect(await appOffsetTag.getAttribute("aria-label")).toContain("+1m");
    expect(
      await servicePane.$(byTestId(redesignedShellTestIds.paneHeaderOffset)).getAttribute("aria-label"),
    ).toContain("0 ms");
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeElementsArrayOfSize(0);

    await clickElementWithJavaScript(await appPane.$('[data-line-number="1"]'));
    await expect(await servicePane.$('[data-line-number="61"]').getAttribute("data-sync-target")).toBe("true");

    await clickElementWithJavaScript(await servicePane.$(byTestId(redesignedShellTestIds.paneHeaderOffset)));
    const serviceOffsetPopover = await servicePane.$(byTestId(redesignedShellTestIds.timeOffsetPopover));
    await expect(serviceOffsetPopover).toBeExisting();
    await expectCompactPopoverInsidePane(servicePane, serviceOffsetPopover, 120);
    await expectMockupTimeOffsetPopover(serviceOffsetPopover, "service.log");

    await clickElementWithJavaScript(await directoryPane.$(byTestId(redesignedShellTestIds.paneHeaderOffset)));
    const directoryOffsetPopover = await directoryPane.$(byTestId(redesignedShellTestIds.timeOffsetPopover));
    await expect(directoryOffsetPopover).toBeExisting();
    await expectCompactPopoverInsidePane(directoryPane, directoryOffsetPopover, 120);
    await expectMockupTimeOffsetPopover(directoryOffsetPopover, "app-2026-06-16.log");
    await expect(await servicePane.$$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeElementsArrayOfSize(0);
  });
});

async function setInputValue(element: WebdriverIO.Element, value: string): Promise<void> {
  await element.waitForExist();
  await browser.execute(
    (target: HTMLInputElement, nextValue: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

      valueSetter?.call(target, nextValue);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    },
    element,
    value,
  );
  await expect(element).toHaveValue(value);
}

async function pressEscapeInElement(element: WebdriverIO.Element): Promise<void> {
  await element.waitForExist();
  await browser.execute((target: HTMLElement) => {
    target.focus();
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
  }, element);
}

async function isFocused(element: WebdriverIO.Element): Promise<boolean> {
  await element.waitForExist();
  return browser.execute((target: HTMLElement) => document.activeElement === target, element);
}

async function expectMockupTimeOffsetPopover(
  popover: WebdriverIO.Element,
  sourceName: string,
): Promise<void> {
  await expect(await popover.$("h3")).toHaveText("Time Offset");
  await expect(await popover.$(".crosslog-time-offset-popover__source")).toHaveText(sourceName);

  const labels = await Promise.all(
    (await popover.$$(".crosslog-time-offset-popover__field-label")).map((label) => label.getText()),
  );
  expect(labels).toEqual(["Days", "Hours", "Min", "Sec", "Ms"]);

  const metrics = await browser.execute((element: HTMLElement) => {
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
  }, popover);

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
  pane: WebdriverIO.Element,
  popover: WebdriverIO.Element,
  maxHeight: number,
): Promise<void> {
  const bounds = await browser.execute((paneElement: HTMLElement, popoverElement: HTMLElement) => {
    const paneRect = paneElement.getBoundingClientRect();
    const paneHeaderRect = paneElement.querySelector<HTMLElement>('[data-testid="pane-header"]')?.getBoundingClientRect();
    const popoverRect = popoverElement.getBoundingClientRect();

    if (!paneHeaderRect) {
      throw new Error("Missing pane header while checking popover placement.");
    }

    return {
      paneLeft: paneRect.left,
      paneRight: paneRect.right,
      paneHeaderBottom: paneHeaderRect.bottom,
      popoverLeft: popoverRect.left,
      popoverRight: popoverRect.right,
      popoverTop: popoverRect.top,
      popoverHeight: popoverRect.height,
    };
  }, pane, popover);

  expect(bounds.popoverLeft).toBeGreaterThanOrEqual(bounds.paneLeft - 1);
  expect(bounds.popoverRight).toBeLessThanOrEqual(bounds.paneRight + 1);
  expect(bounds.popoverTop).toBeGreaterThanOrEqual(bounds.paneHeaderBottom - 1);
  expect(bounds.popoverHeight).toBeLessThan(maxHeight);
}
