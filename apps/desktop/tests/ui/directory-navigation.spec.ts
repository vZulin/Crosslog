import { expect } from "@wdio/globals";
import { redesignedShellTestIds, type RedesignedShellTestId } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop directory navigation", () => {
  it("navigates directory files without auto-switching on refresh", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    await expect(directoryHeaderField(redesignedShellTestIds.paneHeaderDirectoryTitle)).toBeExisting();
    await expect(directoryHeaderField(redesignedShellTestIds.paneHeaderSelectedFile)).toBeExisting();
    await waitForUiTestTitleFragment("directory=logs/2026");
    await waitForUiTestTitleFragment("directoryFile=app-2026-06-16.log");
    await waitForUiTestTitleFragment("directoryPrevious=off");
    await waitForUiTestTitleFragment("directoryNext=on");
    await expect(await directoryButton("Previous file in logs/2026")).toBeDisabled();

    await clickElementWithJavaScript(await directoryButton("Next file in logs/2026"));
    await waitForUiTestTitleFragment("directoryFile=app-2026-06-15.log");
    await waitForUiTestTitleFragment("directoryPrevious=on");
    await waitForUiTestTitleFragment("directoryNext=on");

    await clickElementWithJavaScript(await directoryButton("Previous file in logs/2026"));
    await clickElementWithJavaScript(await $("button=Discover newer directory file"));
    await waitForUiTestTitleFragment("directoryFile=app-2026-06-16.log");
    await waitForUiTestTitleFragment("directoryPrevious=on");

    await clickElementWithJavaScript(await directoryButton("Previous file in logs/2026"));
    await waitForUiTestTitleFragment("directoryFile=app-2026-06-17.log");
  });
});

function directoryHeaderField(testId: RedesignedShellTestId): WebdriverIO.Element {
  return $(byTestId(testId));
}

function directoryButton(label: string): WebdriverIO.Element {
  return $(`button[aria-label="${label}"]`);
}
