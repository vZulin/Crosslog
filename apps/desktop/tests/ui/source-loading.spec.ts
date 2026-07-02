import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  enqueueDesktopUiTestAction,
  getRedesignedShell,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop source loading", () => {
  // The native OS file dialog (bug 2) and the native OS drag gesture (bug 3)
  // cannot be driven from WebdriverIO on macOS; those end-to-end gestures are
  // verified by scripts/macos/test-ui-manual.sh. These automatable checks cover
  // the surrounding wiring: the picker entry points are present and safe, and a
  // native drop routes through openDroppedSources into a pane.

  it("exposes safe source picker entry points", async () => {
    await waitForDesktopShell();
    const shell = getRedesignedShell();

    await expect(shell.emptyWorkspace).toBeExisting();
    await expect(shell.emptyOpenFile).toBeExisting();
    await expect(shell.emptyOpenDirectory).toBeExisting();
    await expect(shell.emptyDropZone).toBeExisting();
    await expect(shell.commandField).toBeDisabled();
    await expect(shell.activityRail.$(`[data-testid="${redesignedShellTestIds.activityRailFiles}"]`)).toBeDisabled();
    await expect(shell.activityRail.$(`[data-testid="${redesignedShellTestIds.activityRailSearch}"]`)).toBeDisabled();
  });

  it("opens a pane from a native drag-and-drop payload", async () => {
    await waitForDesktopShell();
    const shell = getRedesignedShell();

    await expect(shell.logPanes).toBeElementsArrayOfSize(0);

    enqueueDesktopUiTestAction("dropNativeSampleSource");

    await waitForUiTestTitleFragment("sourceEntry=drag-drop");
    await waitForUiTestTitleFragment("sourceKind=file");
    await expect(shell.logPanes).toBeElementsArrayOfSize(1);
    await expect(shell.shell.$("aria/dropped-native.log")).toBeExisting();
  });
});
