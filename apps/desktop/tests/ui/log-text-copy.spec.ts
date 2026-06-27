import { expect } from "@wdio/globals";
import {
  enqueueDesktopUiTestAction,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop log text copy", () => {
  it("keeps copy command available per pane", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();
    enqueueDesktopUiTestAction("copyFirstPane");
    await waitForUiTestTitleFragment("copied=app.log");

    await expect($("aria/Copied app.log")).toBeExisting();
  });
});
