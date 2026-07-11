import { $, $$, browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
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

    await dragPaneReorderFromHeader("app.log", "service.log");
    await waitForUiTestTitleFragment("paneOrder=service.log,app.log,app-2026-06-16.log");
    await clickHeaderSearchWithoutReorder("service.log");
    await waitForUiTestTitleFragment("search=open");
    await waitForUiTestTitleFragment("paneOrder=service.log,app.log,app-2026-06-16.log");

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

async function dragPaneReorderFromHeader(draggedTitle: string, targetTitle: string): Promise<void> {
  await browser.execute((draggedPaneTitle: string) => {
    const draggedPane = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).find(
      (pane) => pane.getAttribute("aria-label") === `Log pane ${draggedPaneTitle}`,
    );
    const draggedHeader = draggedPane?.querySelector<HTMLElement>('[data-testid="pane-header"]');
    const draggedTitleElement =
      draggedHeader?.querySelector<HTMLElement>(".crosslog-pane-header__title") ?? draggedHeader;

    if (!draggedTitleElement) {
      throw new Error(`Missing pane header drag origin for ${draggedPaneTitle}.`);
    }

    const startRect = draggedTitleElement.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    draggedTitleElement.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: startX,
      clientY: startY,
      pointerId: 9,
    }));
  }, draggedTitle);

  await browser.pause(0);
  await browser.execute((draggedPaneTitle: string, targetPaneTitle: string) => {
    const draggedPane = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).find(
      (pane) => pane.getAttribute("aria-label") === `Log pane ${draggedPaneTitle}`,
    );
    const draggedHeader = draggedPane?.querySelector<HTMLElement>('[data-testid="pane-header"]');
    const targetPane = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).find(
      (pane) => pane.getAttribute("aria-label") === `Log pane ${targetPaneTitle}`,
    );

    if (!draggedHeader || !targetPane) {
      throw new Error(`Missing reorder drag target for ${draggedPaneTitle} -> ${targetPaneTitle}.`);
    }

    const startRect = draggedHeader.getBoundingClientRect();
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

async function clickHeaderSearchWithoutReorder(paneTitle: string): Promise<void> {
  await browser.execute((targetPaneTitle: string, searchTestId: string) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${targetPaneTitle}`,
    );
    const searchButton = pane?.querySelector<HTMLButtonElement>(`[data-testid="${searchTestId}"]`);

    if (!searchButton) {
      throw new Error(`Missing search header control for ${targetPaneTitle}.`);
    }

    searchButton.click();
  }, paneTitle, redesignedShellTestIds.paneHeaderSearch);
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
