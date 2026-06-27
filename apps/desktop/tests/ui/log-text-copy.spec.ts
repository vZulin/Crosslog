import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop log text copy", () => {
  it("keeps copy command available per pane", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPane = (await $$(byTestId(redesignedShellTestIds.logPane)))[0];

    await expect(await appPane.$(byTestId(redesignedShellTestIds.paneHeader))).toBeExisting();
    await clickElementWithJavaScript(await appPane.$('button[aria-label="Copy selected text from app.log"]'));
    await expect(await appPane.$("aria/Copied app.log")).toBeExisting();
  });
});
