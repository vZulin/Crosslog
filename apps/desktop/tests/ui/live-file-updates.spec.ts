import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  activateLogPaneByTitle,
  byTestId,
  clickElementWithJavaScript,
  enqueueDesktopUiTestAction,
  expectObsoleteControlsAbsent,
  getLogPaneByTitle,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop live file updates", () => {
  it("appends, retains deleted content, and treats replacement as pane-local", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();
    await expectObsoleteControlsAbsent();

    const appPane = await activateLogPaneByTitle("app.log");
    const appHeader = await appPane.$(byTestId(redesignedShellTestIds.paneHeader));
    await waitForUiTestTitleFragment("lifecycle=app.log:live");
    await expectElementTextContent(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderLive)), "Live");

    enqueueDesktopUiTestAction("appendActiveFile");
    await waitForUiTestTitleFragment("lifecycle=app.log:live");
    await expectObsoleteControlsAbsent();
    await expect(await appPane.$("code*=live appended line")).toBeExisting();
    await expectElementTextContent(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderLive)), "Live");

    enqueueDesktopUiTestAction("deleteActiveFile");
    await waitForUiTestTitleFragment("lifecycle=app.log:deleted");
    await expectObsoleteControlsAbsent();
    const deletedAppPane = await getLogPaneByTitle("app.log");
    const deletedAppHeader = await deletedAppPane.$(byTestId(redesignedShellTestIds.paneHeader));
    await expectElementTextContent(
      await deletedAppHeader.$(byTestId(redesignedShellTestIds.paneHeaderDeleted)),
      "Deleted",
    );
    await expectElementTextContent(
      await deletedAppPane.$(byTestId(redesignedShellTestIds.paneDeletedStatus)),
      "app.log was deleted. Loaded content is retained.",
    );

    await clickElementWithJavaScript(await deletedAppPane.$(byTestId(redesignedShellTestIds.paneHeaderSearch)));
    const searchPopover = await deletedAppPane.$(byTestId(redesignedShellTestIds.paneSearchPopover));
    await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchField)).setValue("live appended line");
    await expect(await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("1 of 1");

    await activateLogPaneByTitle("app.log");
    enqueueDesktopUiTestAction("replaceActiveFile");
    await waitForUiTestTitleFragment("lifecycle=app.log:replaced");
    await expectObsoleteControlsAbsent();
    const replacedAppPane = await getLogPaneByTitle("app.log");
    const replacedAppHeader = await replacedAppPane.$(byTestId(redesignedShellTestIds.paneHeader));
    await expectElementTextContent(
      await replacedAppHeader.$(byTestId(redesignedShellTestIds.paneHeaderReplaced)),
      "Replaced",
    );
    await expect(await replacedAppPane.$("code*=replacement file started")).toBeExisting();
    await expect(await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("0 of 0");
  });
});

async function expectElementTextContent(element: WebdriverIO.Element, expectedText: string): Promise<void> {
  await element.waitForExist();
  await browser.waitUntil(
    async () => {
      const textContent = await browser.execute((target: HTMLElement) => target.textContent?.trim() ?? "", element);

      return textContent === expectedText;
    },
    {
      interval: 250,
      timeout: 5_000,
      timeoutMsg: `Expected element textContent to equal: ${expectedText}`,
    },
  );
}
