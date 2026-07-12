import { $, $$, browser, expect } from "@wdio/globals";
import {
  activateLogPaneByTitle,
  dragPaneResizeBoundary,
  enqueueDesktopUiTestAction,
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop multi-pane layout", () => {
  it("opens, reorders, and searches across multiple log panes", async () => {
    await waitForDesktopShell();
    await browser.setWindowSize(1920, 720);
    const shell = getRedesignedShell();

    await expect(shell.shell).toBeExisting();
    await expect(shell.topbar).toBeExisting();
    await expect(shell.commandField).toBeExisting();
    await expect(shell.commandField).toBeDisabled();
    await expect(shell.activityRail).toBeExisting();
    await expect(shell.paneWorkspace).toBeExisting();

    await openSampleLogsWithUiBridge();

    await expect(shell.paneWorkspace).toBeExisting();
    expect(await shell.statusBar.getText()).toContain("3 panes");
    await expect($('aria/app.log')).toBeExisting();
    await expect($('aria/service.log')).toBeExisting();
    await expectObsoleteControlsAbsent();
    await waitForDesktopRightEdgeAlignment();
    await waitForUiTestTitleFragment("paneOrder=app.log,service.log,app-2026-06-16.log");
    await waitForUiTestTitleFragment("maxGutterDigits=3");

    await browser.execute(() => {
      const viewport = document
        .querySelector<HTMLElement>('[aria-label="Log pane app.log"]')
        ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

      if (!viewport) {
        throw new Error("Missing app.log viewport.");
      }

      viewport.focus();
      viewport.dispatchEvent(new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowDown",
      }));
    });
    await waitForUiTestTitleFragment("lastNavigation=keyboard");

    enqueueDesktopUiTestAction("reorderFirstPaneAfterSecond");
    await waitForUiTestTitleFragment("paneOrder=service.log,app.log,app-2026-06-16.log");
    await activateLogPaneByTitle("service.log");
    enqueueDesktopUiTestAction("openActivePaneSearch");
    await waitForUiTestTitleFragment("search=open");
    await waitForUiTestTitleFragment("searchPane=service.log");
    await waitForUiTestTitleFragment("paneOrder=service.log,app.log,app-2026-06-16.log");
  });

  it("adds and resizes panes when the workspace overflows", async () => {
    await waitForDesktopShell();
    await browser.setWindowSize(1920, 720);
    const shell = getRedesignedShell();

    await openSampleLogsWithUiBridge();
    await expect(shell.paneWorkspace).toBeExisting();
    await expect($$('[data-testid="log-pane"]')).toBeElementsArrayOfSize(3);

    await browser.setWindowSize(960, 720);
    await waitForDesktopWorkspaceOverflow();
    // Native drops are delivered through the platform drag-drop channel; add the
    // fourth pane via the same native-drop wiring the app uses at runtime. The
    // bridge action is consumed asynchronously, so wait for the drag-drop
    // evidence before asserting the new pane count.
    enqueueDesktopUiTestAction("dropNativeSampleSource");
    await waitForUiTestTitleFragment("sourceEntry=drag-drop");
    await expect($$('[data-testid="log-pane"]')).toBeElementsArrayOfSize(4);

    const appPaneWidthBefore = await getPaneWidth("app.log");
    await dragPaneResizeBoundary("app.log", 80);
    await browser.waitUntil(async () => (await getPaneWidth("app.log")) > appPaneWidthBefore, {
      interval: 250,
      timeout: 5_000,
      timeoutMsg: "Expected app.log pane width to increase after boundary drag.",
    });

    await browser.execute((selector: string) => {
      const workspace = document.querySelector<HTMLElement>(selector);

      if (workspace) {
        workspace.scrollLeft = 120;
        workspace.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
    }, '[data-testid="pane-workspace"]');
    await browser.waitUntil(async () => {
      return browser.execute(() => {
        const workspace = document.querySelector<HTMLElement>('[data-testid="pane-workspace"]');

        return workspace ? workspace.scrollWidth > workspace.clientWidth + 1 : false;
      });
    }, {
      interval: 250,
      timeout: 10_000,
      timeoutMsg: "Expected desktop workspace overflow after narrowing the window.",
    });
  });
});

async function getPaneWidth(title: string): Promise<number> {
  return browser.execute((paneTitle: string) => {
    const panes = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]'));
    const pane = panes.find((entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`);

    if (!pane) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    return pane.getBoundingClientRect().width;
  }, title);
}

async function waitForDesktopRightEdgeAlignment(): Promise<void> {
  await browser.waitUntil(async () => {
    const gap = await browser.execute(() => {
      const workspace = document.querySelector<HTMLElement>('[data-testid="pane-workspace"]');
      const panes = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]'));
      const rightmostPane = panes.at(-1);

      if (!workspace || !rightmostPane) {
        return Number.POSITIVE_INFINITY;
      }

      return Math.round(workspace.getBoundingClientRect().right - rightmostPane.getBoundingClientRect().right);
    });

    return gap <= 1;
  }, {
    interval: 250,
    timeout: 10_000,
    timeoutMsg: "Expected desktop workspace right edge alignment.",
  });
}

async function waitForDesktopWorkspaceOverflow(): Promise<void> {
  await browser.waitUntil(async () => {
    return browser.execute(() => {
      const workspace = document.querySelector<HTMLElement>('[data-testid="pane-workspace"]');

      return workspace ? workspace.scrollWidth > workspace.clientWidth + 1 : false;
    });
  }, {
    interval: 250,
    timeout: 10_000,
    timeoutMsg: "Expected desktop workspace horizontal overflow.",
  });
}
