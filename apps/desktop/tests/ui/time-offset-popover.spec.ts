import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop time offset popover", () => {
  it("applies valid pane offsets and rejects invalid offset drafts", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const panes = await $$(byTestId(redesignedShellTestIds.logPane));
    const appPane = panes[0]!;
    const servicePane = panes[1]!;
    const appOffsetTag = await appPane.$(byTestId(redesignedShellTestIds.paneHeaderOffset));

    await clickElementWithJavaScript(appOffsetTag);
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeExisting();

    const minutesInput = await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMinutes));
    const applyButton = await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply));

    await setTextInputValue(minutesInput, "invalid");
    await expect(await appPane.$('[role="alert"]')).toHaveText(expect.stringContaining("whole-number"));
    await expect(applyButton).toBeDisabled();
    expect(await appOffsetTag.getAttribute("aria-label")).toContain("0 ms");

    await setTextInputValue(minutesInput, "1");
    await browser.waitUntil(async () => applyButton.isEnabled(), {
      interval: 100,
      timeout: 5_000,
      timeoutMsg: "Time offset apply button did not become enabled after a valid draft.",
    });
    await clickElementWithJavaScript(applyButton);

    expect(await appOffsetTag.getAttribute("aria-label")).toContain("+1m");
    expect(
      await servicePane.$(byTestId(redesignedShellTestIds.paneHeaderOffset)).getAttribute("aria-label"),
    ).toContain("0 ms");
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeElementsArrayOfSize(0);

    await clickElementWithJavaScript(await appPane.$('[data-line-number="1"]'));
    await expect(await servicePane.$('[data-line-number="61"]').getAttribute("data-sync-target")).toBe("true");
  });
});

async function setTextInputValue(input: WebdriverIO.Element, value: string): Promise<void> {
  await browser.execute(
    (target: HTMLInputElement, nextValue: string) => {
      target.value = nextValue;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    },
    input,
    value,
  );
}
