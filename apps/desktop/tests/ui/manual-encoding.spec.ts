import { expect } from "@wdio/globals";
import { getRedesignedShell, waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop manual encoding", () => {
  it("keeps the shell available for encoding workflows", async () => {
    await waitForDesktopShell();
    const shell = getRedesignedShell();

    await expect(shell.shell).toBeExisting();
    await expect(shell.topbar).toBeExisting();
    await expect(shell.activityRail).toBeExisting();
    await expect(shell.paneWorkspace).toBeExisting();
    expect(await shell.statusBar.getText()).toContain("0 panes");
  });
});
