import { browser, expect } from "@wdio/globals";
import {
  clickElementWithJavaScript,
  enqueueDesktopUiTestAction,
  getLogPaneByTitle,
  getRedesignedShell,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForSessionSnapshotWritten,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop session restore", () => {
  it("restores pane layout after restart without requiring scroll state", async () => {
    await waitForDesktopShell();
    const shell = getRedesignedShell();

    await expect(shell.shell).toBeExisting();
    await expect(shell.topbar).toBeExisting();
    await expect(shell.activityRail).toBeExisting();
    await expect(shell.paneWorkspace).toBeExisting();

    await openSampleLogsWithUiBridge();

    await clickElementWithJavaScript(await $("button[aria-label=\"Move boundary after app.log right\"]"));
    enqueueDesktopUiTestAction("navigateNextDirectoryFile");
    await waitForUiTestTitleFragment("directoryFile=app-2026-06-15.log");
    enqueueDesktopUiTestAction("openActivePaneTimeOffset");
    await waitForUiTestTitleFragment("timeOffset=open");
    enqueueDesktopUiTestAction("setActivePaneTimeOffset");
    await waitForUiTestTitleFragment("activeOffset=+1m");
    enqueueDesktopUiTestAction("toggleSynchronization");
    await waitForUiTestTitleFragment("sync=off");

    const resizedAppWidth = await getElementWidth(await getLogPaneByTitle("app.log"));
    expect(resizedAppWidth).toBeGreaterThan(520);
    await setAppScrollerScrollLeft(160);
    await expect(await getAppScrollerScrollLeft()).toBe(160);
    await waitForSessionSnapshotWritten();

    await browser.refresh();

    await waitForUiTestTitleFragment("state=logs");
    await waitForUiTestTitleFragment("panes=3");
    await waitForUiTestTitleFragment("sync=off");
    await waitForUiTestTitleFragment("activeOffset=+1m");
    await waitForUiTestTitleFragment("directoryFile=app-2026-06-15.log");
    await waitForUiTestTitleFragment("files=app.log,service.log,app-2026-06-15.log");
    await expect(await getLogPaneByTitle("app.log")).toBeExisting();
    await expect(await getLogPaneByTitle("service.log")).toBeExisting();
    await expect(await getLogPaneByTitle("app-2026-06-15.log")).toBeExisting();
    await expect(shell.workspaceScrollbar).toBeExisting();
    expect(await shell.statusBar.getText()).toContain("3 panes");
    expect(await shell.statusBar.getText()).toContain("Sync off");
    expect(await getElementWidth(await getLogPaneByTitle("app.log"))).toBe(resizedAppWidth);
    await expect(await getAppScrollerScrollLeft()).toBe(0);
  });
});

async function getElementWidth(element: WebdriverIO.Element): Promise<number> {
  return browser.execute((target: HTMLElement) => target.getBoundingClientRect().width, element);
}

async function setAppScrollerScrollLeft(scrollLeft: number): Promise<void> {
  await browser.execute((nextScrollLeft: number) => {
    const scroller = document.querySelector<HTMLElement>('[aria-label="Horizontal log scroller for app.log"]');

    if (!scroller) {
      throw new Error("Missing app.log horizontal scroller.");
    }

    scroller.scrollLeft = nextScrollLeft;
    scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
  }, scrollLeft);
}

async function getAppScrollerScrollLeft(): Promise<number> {
  return browser.execute(() => {
    const scroller = document.querySelector<HTMLElement>('[aria-label="Horizontal log scroller for app.log"]');

    if (!scroller) {
      throw new Error("Missing app.log horizontal scroller.");
    }

    return scroller.scrollLeft;
  });
}
