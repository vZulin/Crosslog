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
    await expectCompactPopoverInsidePane(appPane, appOffsetPopover, 100);
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
    await expectCompactPopoverInsidePane(servicePane, serviceOffsetPopover, 100);

    await clickElementWithJavaScript(await directoryPane.$(byTestId(redesignedShellTestIds.paneHeaderOffset)));
    const directoryOffsetPopover = await directoryPane.$(byTestId(redesignedShellTestIds.timeOffsetPopover));
    await expect(directoryOffsetPopover).toBeExisting();
    await expectCompactPopoverInsidePane(directoryPane, directoryOffsetPopover, 100);
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

async function expectCompactPopoverInsidePane(
  pane: WebdriverIO.Element,
  popover: WebdriverIO.Element,
  maxHeight: number,
): Promise<void> {
  const bounds = await browser.execute((paneElement: HTMLElement, popoverElement: HTMLElement) => {
    const paneRect = paneElement.getBoundingClientRect();
    const popoverRect = popoverElement.getBoundingClientRect();

    return {
      paneLeft: paneRect.left,
      paneRight: paneRect.right,
      popoverLeft: popoverRect.left,
      popoverRight: popoverRect.right,
      popoverHeight: popoverRect.height,
    };
  }, pane, popover);

  expect(bounds.popoverLeft).toBeGreaterThanOrEqual(bounds.paneLeft - 1);
  expect(bounds.popoverRight).toBeLessThanOrEqual(bounds.paneRight + 1);
  expect(bounds.popoverHeight).toBeLessThan(maxHeight);
}
