import { expect } from "@wdio/globals";
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
    const appOffsetTag = await appPane.$(byTestId(redesignedShellTestIds.paneHeaderOffset));

    await clickElementWithJavaScript(appOffsetTag);
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeExisting();
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMinutes))).toBeExisting();
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply))).toBeExisting();
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
  });
});
