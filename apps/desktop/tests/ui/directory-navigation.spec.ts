import { expect } from "@wdio/globals";
import {
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop directory navigation", () => {
  it("navigates directory files without auto-switching on refresh", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    await expect(directoryHeading("app-2026-06-16.log")).toBeExisting();
    await expect(directoryButton("Previous file in logs/2026")).toBeDisabled();

    await clickElementWithJavaScript(await directoryButton("Next file in logs/2026"));
    await expect(directoryHeading("app-2026-06-15.log")).toBeExisting();

    await clickElementWithJavaScript(await directoryButton("Previous file in logs/2026"));
    await clickElementWithJavaScript(await $("button=Discover newer directory file"));
    await expect(directoryHeading("app-2026-06-16.log")).toBeExisting();

    await clickElementWithJavaScript(await directoryButton("Previous file in logs/2026"));
    await expect(directoryHeading("app-2026-06-17.log")).toBeExisting();
  });
});

function directoryHeading(fileName: string): WebdriverIO.Element {
  return $(`h2=${fileName}`);
}

function directoryButton(label: string): WebdriverIO.Element {
  return $(`button[aria-label="${label}"]`);
}
