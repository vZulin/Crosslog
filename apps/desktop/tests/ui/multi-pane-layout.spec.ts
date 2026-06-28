import { $, $$, browser, expect } from "@wdio/globals";
import {
  clickElementWithJavaScript,
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop multi-pane layout", () => {
  it("opens and manages multiple log panes", async () => {
    await waitForDesktopShell();
    const shell = getRedesignedShell();

    await expect(shell.shell).toBeExisting();
    await expect(shell.topbar).toBeExisting();
    await expect(shell.commandField).toBeExisting();
    await expect(shell.activityRail).toBeExisting();
    await expect(shell.paneWorkspace).toBeExisting();

    await openSampleLogsWithUiBridge();

    await expect(shell.paneWorkspace).toBeExisting();
    expect(await shell.statusBar.getText()).toContain("3 panes");
    await expect($('aria/app.log')).toBeExisting();
    await expect($('aria/service.log')).toBeExisting();
    await expectObsoleteControlsAbsent();

    await clickElementWithJavaScript(await shell.topbar.$('[data-testid="topbar-add-pane"]'));
    await expect($$('[data-testid="log-pane"]')).toBeElementsArrayOfSize(4);

    await browser.execute((selector: string) => {
      const workspace = document.querySelector<HTMLElement>(selector);

      if (workspace) {
        workspace.scrollLeft = 120;
        workspace.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
    }, '[data-testid="pane-workspace"]');
    await expect(shell.workspaceScrollbar).toBeExisting();
  });
});
