import { $$, browser, expect } from "@wdio/globals";
import {
  activateLogPaneByTitle,
  dragPaneResizeBoundary,
  enqueueDesktopUiTestAction,
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  getLogPaneByTitle,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";
import { redesignedShellTestIds } from "@crosslog/ui";

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
    await expect(await getLogPaneByTitle("app.log")).toBeExisting();
    await expect(await getLogPaneByTitle("service.log")).toBeExisting();
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

    await beginDesktopPaneReorderDrag("app.log");
    await expectDesktopReorderOutlineAt("app.log");
    await moveDesktopPaneReorderDragTo("service.log", 0.45);
    await expectDesktopReorderOutlineAt("app.log");
    await moveDesktopPaneReorderDragTo("service.log", 0.75);
    await expectDesktopReorderOutlineAt("service.log");
    await finishDesktopPaneReorderDragTo("service.log", 0.75);
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

async function beginDesktopPaneReorderDrag(title: string): Promise<void> {
  await browser.execute((paneTitle: string, paneTestId: string, headerTestId: string) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );
    const header = pane?.querySelector<HTMLElement>(`[data-testid="${headerTestId}"]`);
    const titleElement = header?.querySelector<HTMLElement>(".crosslog-pane-header__title") ?? header;

    if (!titleElement) {
      throw new Error(`Missing pane header drag origin for ${paneTitle}.`);
    }

    const rect = titleElement.getBoundingClientRect();
    titleElement.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      pointerId: 9,
    }));
  }, title, redesignedShellTestIds.logPane, redesignedShellTestIds.paneHeader);

  await browser.pause(0);
}

async function moveDesktopPaneReorderDragTo(title: string, horizontalFraction: number): Promise<void> {
  const targetX = await browser.execute((paneTitle: string, paneTestId: string, fraction: number) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );

    if (!pane) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    const rect = pane.getBoundingClientRect();
    return rect.left + rect.width * fraction;
  }, title, redesignedShellTestIds.logPane, horizontalFraction);

  await browser.execute((clientX: number) => {
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      clientX,
      clientY: 24,
      pointerId: 9,
    }));
  }, targetX);
}

async function finishDesktopPaneReorderDragTo(title: string, horizontalFraction: number): Promise<void> {
  const targetX = await browser.execute((paneTitle: string, paneTestId: string, fraction: number) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );

    if (!pane) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    const rect = pane.getBoundingClientRect();
    return rect.left + rect.width * fraction;
  }, title, redesignedShellTestIds.logPane, horizontalFraction);

  await browser.execute((clientX: number) => {
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      clientX,
      clientY: 24,
      pointerId: 9,
    }));
  }, targetX);
}

async function expectDesktopReorderOutlineAt(title: string): Promise<void> {
  await browser.waitUntil(async () => {
    return browser.execute((paneTitle: string, paneTestId: string, outlineTestId: string) => {
      const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
        (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
      );
      const outline = document.querySelector<HTMLElement>(`[data-testid="${outlineTestId}"]`);
      const paneRail = document.querySelector<HTMLElement>('[data-testid="pane-rail"]');

      if (!pane || !outline || !paneRail) {
        return false;
      }

      const paneRect = pane.getBoundingClientRect();
      const outlineRect = outline.getBoundingClientRect();
      const paneRailRect = paneRail.getBoundingClientRect();

      return (
        Math.abs((outlineRect.left - paneRailRect.left) - (paneRect.left - paneRailRect.left)) <= 1 &&
        Math.abs(outlineRect.width - paneRect.width) <= 1
      );
    }, title, redesignedShellTestIds.logPane, redesignedShellTestIds.paneReorderOutline);
  }, {
    interval: 150,
    timeout: 5_000,
    timeoutMsg: `Expected reorder outline to align with ${title}.`,
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
