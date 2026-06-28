import { $, $$, browser, expect } from "@wdio/globals";
import {
  clickElementWithJavaScript,
  dragPaneResizeBoundary,
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop multi-pane layout", () => {
  it("opens and manages multiple log panes", async () => {
    await waitForDesktopShell();
    await browser.setWindowSize(1920, 720);
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
    await waitForDesktopRightEdgeAlignment();

    await browser.setWindowSize(960, 720);
    await waitForDesktopWorkspaceOverflow();
    await clickElementWithJavaScript(await shell.topbar.$('[data-testid="topbar-add-pane"]'));
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
    await expect(shell.workspaceScrollbar).toBeExisting();
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
