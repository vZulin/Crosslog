import { expect } from "@wdio/globals";
import { redesignedShellTestIds, type RedesignedShellTestId } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop directory navigation", () => {
  it("navigates directory files without auto-switching on refresh", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    await expect(await directoryHeaderField(redesignedShellTestIds.paneHeaderDirectoryTitle)).toHaveText("logs/2026");
    await expect(await directoryHeaderField(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
      "app-2026-06-16.log",
    );
    await expect(await directoryButton("Previous file in logs/2026")).toBeDisabled();

    await clickElementWithJavaScript(await directoryButton("Next file in logs/2026"));
    await expect(await directoryHeaderField(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
      "app-2026-06-15.log",
    );

    await clickElementWithJavaScript(await directoryButton("Previous file in logs/2026"));
    await clickElementWithJavaScript(await $("button=Discover newer directory file"));
    await expect(await directoryHeaderField(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
      "app-2026-06-16.log",
    );

    await clickElementWithJavaScript(await directoryButton("Previous file in logs/2026"));
    await expect(await directoryHeaderField(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
      "app-2026-06-17.log",
    );
  });
});

function directoryHeaderField(testId: RedesignedShellTestId): WebdriverIO.Element {
  return $(byTestId(testId));
}

function directoryButton(label: string): WebdriverIO.Element {
  return $(`button[aria-label="${label}"]`);
}
