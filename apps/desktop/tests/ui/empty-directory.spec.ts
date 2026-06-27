import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  enqueueDesktopUiTestAction,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop empty directory", () => {
  it("shows empty-directory status for directories without top-level files", async () => {
    await waitForDesktopShell();
    enqueueDesktopUiTestAction("openEmptyDirectory");
    await waitForUiTestTitleFragment("state=logs");
    await waitForUiTestTitleFragment("directory=logs/2026");
    await waitForUiTestTitleFragment("directoryFiles=0");
    await waitForUiTestTitleFragment("emptyDirectory=on");

    await expect($(byTestId(redesignedShellTestIds.paneHeaderEmptyDirectory))).toBeExisting();
    await expect($$(byTestId(redesignedShellTestIds.paneHeaderDirectoryPrevious))).toBeElementsArrayOfSize(0);
    await expect($$(byTestId(redesignedShellTestIds.paneHeaderDirectoryNext))).toBeElementsArrayOfSize(0);
  });
});
