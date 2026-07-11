import { browser, expect } from "@wdio/globals";
import {
  dragPaneResizeBoundary,
  enqueueDesktopUiTestAction,
  expectObsoleteControlsAbsent,
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
    await expectObsoleteControlsAbsent();

    await dragPaneResizeBoundary("app.log", 80);
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
    await browser.waitUntil(async () => {
      return browser.execute(() => {
        const workspace = document.querySelector<HTMLElement>('[data-testid="pane-workspace"]');

        return workspace ? workspace.scrollWidth > workspace.clientWidth + 1 : false;
      });
    }, {
      interval: 250,
      timeout: 10_000,
      timeoutMsg: "Expected restored desktop workspace overflow.",
    });
    await expectObsoleteControlsAbsent();
    expect(await shell.statusBar.getText()).toContain("3 panes");
    expect(await shell.statusBar.getText()).toContain("Sync off");
    expect(await getElementWidth(await getLogPaneByTitle("app.log"))).toBe(resizedAppWidth);
    await expect(await getAppScrollerScrollLeft()).toBe(0);
  });

  it("restores real desktop file content after restart", async () => {
    const restoredFixtureText = "Suppressed a frequent exception logged for the 2nd time";

    await waitForDesktopShell();
    enqueueDesktopUiTestAction("openLargeLog");
    await waitForUiTestTitleFragment("idea.3.log", 20_000);
    await waitForLogPaneText("idea.3.log", restoredFixtureText);
    await waitForSessionSnapshotWritten();

    await browser.refresh();

    await waitForUiTestTitleFragment("state=logs");
    await waitForUiTestTitleFragment("idea.3.log", 20_000);
    await expect(await getLogPaneByTitle("idea.3.log")).toBeExisting();
    await waitForLogPaneText("idea.3.log", restoredFixtureText);
    await expectLogPaneTextAbsent("idea.3.log", "2026-06-16T09:00:09.000Z idea.3.log line 10");
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

async function waitForLogPaneText(title: string, expectedText: string): Promise<void> {
  await browser.waitUntil(
    async () => (await (await getLogPaneByTitle(title)).getText()).includes(expectedText),
    {
      interval: 250,
      timeout: 10_000,
      timeoutMsg: `Log pane ${title} did not contain expected text: ${expectedText}`,
    },
  );
}

async function expectLogPaneTextAbsent(title: string, unexpectedText: string): Promise<void> {
  expect(await (await getLogPaneByTitle(title)).getText()).not.toContain(unexpectedText);
}
