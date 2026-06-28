import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  enqueueDesktopUiTestAction,
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
    enqueueDesktopUiTestAction("copyFirstPane");
    await waitForUiTestTitleFragment("copied=app.log");
  });
});
