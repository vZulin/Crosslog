import { $, $$, browser, expect } from "@wdio/globals";
import {
  dragPaneResizeBoundary,
  enqueueDesktopUiTestAction,
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop multi-pane layout", () => {
  it("opens and manages multiple log panes", async () => {
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

    await dragPaneReorder("app.log", "service.log");
    await waitForUiTestTitleFragment("paneOrder=service.log,app.log,app-2026-06-16.log");

    await browser.setWindowSize(960, 720);
    await waitForDesktopWorkspaceOverflow();
    // Native drops are delivered through the platform drag-drop channel; add the
    // fourth pane via the same native-drop wiring the app uses at runtime.
    enqueueDesktopUiTestAction("dropNativeSampleSource");
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

async function dragPaneReorder(draggedTitle: string, targetTitle: string): Promise<void> {
  await browser.execute((draggedPaneTitle: string) => {
    const draggedHandle = document.querySelector<HTMLElement>(
      `[aria-label="${`Reorder pane ${draggedPaneTitle}`}"]`,
    );

    if (!draggedHandle) {
      throw new Error(`Missing reorder drag handle for ${draggedPaneTitle}.`);
    }

    const startRect = draggedHandle.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    draggedHandle.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: startX,
      clientY: startY,
      pointerId: 9,
    }));
  }, draggedTitle);

  await browser.pause(0);
  await browser.execute((draggedPaneTitle: string, targetPaneTitle: string) => {
    const draggedHandle = document.querySelector<HTMLElement>(
      `[aria-label="${`Reorder pane ${draggedPaneTitle}`}"]`,
    );
    const targetPane = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).find(
      (pane) => pane.getAttribute("aria-label") === `Log pane ${targetPaneTitle}`,
    );

    if (!draggedHandle || !targetPane) {
      throw new Error(`Missing reorder drag target for ${draggedPaneTitle} -> ${targetPaneTitle}.`);
    }

    const startRect = draggedHandle.getBoundingClientRect();
    const targetRect = targetPane.getBoundingClientRect();
    const startY = startRect.top + startRect.height / 2;
    const targetX = targetRect.left + targetRect.width * 0.75;

    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      clientX: targetX,
      clientY: startY,
      pointerId: 9,
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      clientX: targetX,
      clientY: startY,
      pointerId: 9,
    }));
  }, draggedTitle, targetTitle);
}

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
