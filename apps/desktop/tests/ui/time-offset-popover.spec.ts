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
    await expectMockupTimeOffsetPopoverStructure(appOffsetPopover, "app.log");
    await expect(appOffsetMinutes).toBeExisting();
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply))).toBeExisting();
    await expect(await appOffsetPopover.$$('[aria-label^="Close time offset"]')).toBeElementsArrayOfSize(0);
    expect(await appOffsetTag.getAttribute("aria-label")).toContain("0 ms");

    await setInputValue(appOffsetMinutes, "invalid");
    await expect(await appOffsetPopover.$('[role="alert"]')).toHaveText(
      expect.stringContaining("Minutes must be a whole number"),
    );
    expect(await appOffsetMinutes.getAttribute("aria-invalid")).toBe("true");
    const appOffsetApply = await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply));

    expect(await appOffsetApply.getAttribute("disabled")).not.toBeNull();

    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetHours)), "24");
    await setInputValue(appOffsetMinutes, "60");
    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetSeconds)), "60");
    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMilliseconds)), "1000");
    await expect(await appOffsetPopover.$('[role="alert"]')).toHaveText(
      expect.stringContaining("Hours must be between -23 and 23"),
    );
    expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetHours)).getAttribute("aria-invalid")).toBe("true");
    expect(await appOffsetMinutes.getAttribute("aria-invalid")).toBe("true");
    expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetSeconds)).getAttribute("aria-invalid")).toBe("true");
    expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMilliseconds)).getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(await appOffsetApply.getAttribute("disabled")).not.toBeNull();

    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetDays)), "123456");
    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetHours)), "23");
    await setInputValue(appOffsetMinutes, "59");
    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetSeconds)), "59");
    await setInputValue(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMilliseconds)), "999");
    await expect(await appOffsetPopover.$$('[role="alert"]')).toBeElementsArrayOfSize(0);
    expect(await appOffsetApply.getAttribute("disabled")).toBeNull();

    for (const testId of [
      redesignedShellTestIds.timeOffsetDays,
      redesignedShellTestIds.timeOffsetHours,
      redesignedShellTestIds.timeOffsetMinutes,
      redesignedShellTestIds.timeOffsetSeconds,
      redesignedShellTestIds.timeOffsetMilliseconds,
    ]) {
      const field = await appPane.$(byTestId(testId));

      await setInputValue(field, "");
      expect(await field.getAttribute("aria-invalid")).toBeNull();
    }
    await expect(await appOffsetPopover.$$('[role="alert"]')).toBeElementsArrayOfSize(0);
    await clickElementWithJavaScript(appOffsetApply);
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeElementsArrayOfSize(0);
    expect(await appOffsetTag.getAttribute("aria-label")).toContain("0 ms");

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
    await expectMockupTimeOffsetPopoverStructure(serviceOffsetPopover, "service.log");

    await clickElementWithJavaScript(await directoryPane.$(byTestId(redesignedShellTestIds.paneHeaderOffset)));
    const directoryOffsetPopover = await directoryPane.$(byTestId(redesignedShellTestIds.timeOffsetPopover));
    await expect(directoryOffsetPopover).toBeExisting();
    await expectCompactPopoverInsidePane(directoryPane, directoryOffsetPopover, 120);
    await expectMockupTimeOffsetPopoverStructure(directoryOffsetPopover, "app-2026-06-16.log");
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

async function expectMockupTimeOffsetPopoverStructure(
  popover: WebdriverIO.Element,
  sourceName: string,
): Promise<void> {
  const structure = await browser.execute((element: HTMLElement) => {
    return {
      title: element.querySelector<HTMLElement>(".crosslog-time-offset-popover__title")?.textContent?.trim() ?? "",
      source: element.querySelector<HTMLElement>(".crosslog-time-offset-popover__source")?.textContent?.trim() ?? "",
      labels: Array.from(element.querySelectorAll<HTMLElement>(".crosslog-time-offset-popover__field-label"))
        .map((label) => label.textContent?.trim() ?? ""),
      inputCount: element.querySelectorAll<HTMLInputElement>(".crosslog-time-offset-popover__field input").length,
      hasTitleIcon: Boolean(element.querySelector(".crosslog-time-offset-popover__title-icon")),
      hasApplyButton: Boolean(element.querySelector(".crosslog-time-offset-popover__apply")),
    };
  }, popover);

  expect(structure.title).toBe("Time Offset");
  expect(structure.source).toBe(sourceName);
  expect(structure.labels.join("|")).toBe("Days|Hours|Min|Sec|Ms");
  expect(structure.inputCount).toBe(5);
  expect(structure.hasTitleIcon).toBe(true);
  expect(structure.hasApplyButton).toBe(true);
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
