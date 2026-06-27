import { browser, expect } from "@wdio/globals";
import {
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForSessionSnapshotWritten,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop session restore", () => {
  it("restores pane layout after restart without requiring scroll state", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();
    await expect($("h2=app.log")).toBeExisting();
    await waitForSessionSnapshotWritten();

    await browser.refresh();

    await waitForUiTestTitleFragment("state=logs");
    await waitForUiTestTitleFragment("panes=3");
    await expect($("h2=app.log")).toBeExisting();
    await expect($("h2=service.log")).toBeExisting();
    await expect($("h2=app-2026-06-16.log")).toBeExisting();
  });
});
