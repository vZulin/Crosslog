import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  dropDesktopFileOnWorkspace,
  getRedesignedShell,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop source loading", () => {
  it("keeps source picker entry points safe and opens dropped empty-workspace files", async () => {
    await waitForDesktopShell();
    const shell = getRedesignedShell();

    await expect(shell.emptyWorkspace).toBeExisting();
    await expect(shell.emptyOpenSource).toBeExisting();
    await expect(shell.commandField).toBeDisabled();
    await expect(shell.activityRail.$(`[data-testid="${redesignedShellTestIds.activityRailFiles}"]`)).toBeDisabled();
    await expect(shell.activityRail.$(`[data-testid="${redesignedShellTestIds.activityRailSearch}"]`)).toBeDisabled();

    await dropDesktopFileOnWorkspace({
      name: "desktop-dropped.log",
      contents: "2026-06-16T09:00:00.000Z dropped desktop source\n",
      targetTestId: redesignedShellTestIds.emptyDropZone,
    });

    await expect(shell.logPanes).toBeElementsArrayOfSize(1);
    await expect(shell.shell.$("aria/desktop-dropped.log")).toBeExisting();
    await waitForUiTestTitleFragment("sourceEntry=drag-drop");
    await waitForUiTestTitleFragment("sourceKind=file");
  });
});
