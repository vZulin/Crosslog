import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  enqueueDesktopUiTestAction,
  expectObsoleteControlsAbsent,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop log text copy", () => {
  it("keeps copy command available per pane", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPane = (await $$(byTestId(redesignedShellTestIds.logPane)))[0];

    await expect(await appPane.$(byTestId(redesignedShellTestIds.paneHeader))).toBeExisting();
    await expect(await appPane.$$(".crosslog-pane-tools")).toBeElementsArrayOfSize(0);
    await expect(await appPane.$$(".crosslog-log-text-selection__copy")).toBeElementsArrayOfSize(0);
    await expectObsoleteControlsAbsent();
    enqueueDesktopUiTestAction("copyFirstPane");
    await waitForUiTestTitleFragment("copied=app.log");
  });
});
