import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  activateLogPaneByTitle,
  byTestId,
  clickElementWithJavaScript,
  enqueueDesktopUiTestAction,
  getLogPaneByTitle,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop live file updates", () => {
  it("appends, retains deleted content, and treats replacement as pane-local", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPane = await activateLogPaneByTitle("app.log");
    const appHeader = await appPane.$(byTestId(redesignedShellTestIds.paneHeader));
    await waitForUiTestTitleFragment("lifecycle=app.log:live");
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderLive))).toHaveText("Live");

    enqueueDesktopUiTestAction("appendActiveFile");
    await waitForUiTestTitleFragment("lifecycle=app.log:live");
    await expect(await appPane.$("code*=live appended line")).toBeExisting();
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderLive))).toHaveText("Live");

    enqueueDesktopUiTestAction("deleteActiveFile");
    await waitForUiTestTitleFragment("lifecycle=app.log:deleted");
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderDeleted))).toHaveText("Deleted");
    await expect(await appPane.$(byTestId(redesignedShellTestIds.paneDeletedStatus))).toHaveText(
      "app.log was deleted. Loaded content is retained.",
    );

    await clickElementWithJavaScript(await appPane.$(byTestId(redesignedShellTestIds.paneHeaderSearch)));
    const searchPopover = await appPane.$(byTestId(redesignedShellTestIds.paneSearchPopover));
    await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchField)).setValue("live appended line");
    await expect(await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("1 of 1");

    await activateLogPaneByTitle("app.log");
    enqueueDesktopUiTestAction("replaceActiveFile");
    await waitForUiTestTitleFragment("lifecycle=app.log:replaced");
    const replacedAppPane = await getLogPaneByTitle("app.log");
    const replacedAppHeader = await replacedAppPane.$(byTestId(redesignedShellTestIds.paneHeader));
    await expect(await replacedAppHeader.$(byTestId(redesignedShellTestIds.paneHeaderReplaced))).toHaveText("Replaced");
    await expect(await replacedAppPane.$("code*=replacement file started")).toBeExisting();
    await expect(await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("0 of 0");
  });
});
