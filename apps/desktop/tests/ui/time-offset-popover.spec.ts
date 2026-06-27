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

    await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMinutes)).setValue("invalid");
    await expect(await appPane.$('[role="alert"]')).toHaveText(expect.stringContaining("whole-number"));
    await expect(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply))).toBeDisabled();
    await expect(appOffsetTag).toHaveText(expect.stringContaining("0 ms"));

    await appPane.$(byTestId(redesignedShellTestIds.timeOffsetMinutes)).setValue("1");
    await clickElementWithJavaScript(await appPane.$(byTestId(redesignedShellTestIds.timeOffsetApply)));

    await expect(appOffsetTag).toHaveText(expect.stringContaining("+1m"));
    await expect(await servicePane.$(byTestId(redesignedShellTestIds.paneHeaderOffset))).toHaveText(
      expect.stringContaining("0 ms"),
    );
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.timeOffsetPopover))).toBeElementsArrayOfSize(0);

    await clickElementWithJavaScript(await appPane.$('[data-line-number="1"]'));
    await expect(await servicePane.$('[data-line-number="61"]').getAttribute("data-sync-target")).toBe("true");
  });
});
