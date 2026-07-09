import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  enqueueDesktopUiTestAction,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop synchronized scrolling", () => {
  it("synchronizes timestamped panes and supports disabling synchronization", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const topbar = await $(byTestId(redesignedShellTestIds.topbar));
    const statusBar = await $(byTestId(redesignedShellTestIds.statusBar));
    const statusSummary = await statusBar.$('[role="status"]');
    const syncToggle = await topbar.$('[aria-label="Toggle time synchronization"]');
    await expect(syncToggle).toBeExisting();
    await expect(statusSummary).toBeExisting();
    await expect(await syncToggle.getAttribute("aria-pressed")).toBe("true");
    await expect(await topbar.getText()).not.toContain("Sync on");
    await expect(await statusSummary.getAttribute("data-sync-enabled")).toBe("true");
    await expect(await statusSummary.getAttribute("data-active-source")).toBe("app-2026-06-16.log");

    const panes = await $$('[data-testid="log-pane"]');
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="9"]'));
    await expect(await panes[0].$('[data-testid="pane-header"]').getAttribute("aria-current")).toBe("true");
    await expect(await statusSummary.getAttribute("data-active-source")).toBe("app.log");
    await expect(await panes[1].$('[data-line-number="9"]').getAttribute("data-sync-target")).toBe("true");
    await waitForRowsToShareVisualTop("app.log", "service.log", 9);

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
    await waitForViewportLastNavigation("app.log", "keyboard");
    await waitForUiTestTitleFragment("syncTargetLine=10");
    await waitForRowsToShareVisualTop("app.log", "service.log", 10);

    await browser.execute(() => {
      const viewport = document
        .querySelector<HTMLElement>('[aria-label="Log pane app.log"]')
        ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

      if (!viewport) {
        throw new Error("Missing app.log viewport.");
      }

      viewport.scrollTop = Math.min(viewport.scrollHeight - viewport.clientHeight, viewport.scrollTop + 4 * 18);
      viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await waitForViewportLastNavigation("app.log", "wheel");
    await waitForSelectedLineNumber("app.log", "10");
    await expect(await panes[1].$('[data-line-number="10"]').getAttribute("data-sync-target")).toBe("true");
    await waitForRowsToShareVisualTop("app.log", "service.log", 10);
    await waitForUiTestTitleFragment("syncTargetLine=10");

    enqueueDesktopUiTestAction("toggleSynchronization");
    await waitForUiTestTitleFragment("sync=off");
    await expect(await statusSummary.getAttribute("data-sync-enabled")).toBe("false");
    await browser.waitUntil(async () => (await syncToggle.getAttribute("aria-pressed")) === "false", {
      interval: 250,
      timeout: 5_000,
      timeoutMsg: "Topbar synchronization button state did not update to off.",
    });
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="4"]'));
    await expect(await panes[1].$('[data-line-number="10"]').getAttribute("data-sync-target")).toBe("false");
  });

  it("moves the rendered log text on vertical scroll and reaches the first and last lines", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const readViewport = async () =>
      browser.execute(() => {
        const viewport = document
          .querySelector<HTMLElement>('[aria-label="Log pane app.log"]')
          ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

        if (!viewport) {
          throw new Error("Missing app.log viewport.");
        }

        return {
          scrollTop: Math.round(viewport.scrollTop),
          maxScrollTop: viewport.scrollHeight - viewport.clientHeight,
          selectedLine: viewport.getAttribute("data-selected-line-number"),
          hasFirstLine: viewport.querySelector('[data-line-number="1"]') !== null,
          hasLastLine: viewport.querySelector('[data-line-number="250"]') !== null,
        };
      });

    const scrollViewportBy = async (deltaY: number) =>
      browser.execute((delta: number) => {
        const viewport = document
          .querySelector<HTMLElement>('[aria-label="Log pane app.log"]')
          ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

        if (!viewport) {
          throw new Error("Missing app.log viewport.");
        }

        viewport.focus();
        viewport.scrollTop = Math.max(
          0,
          Math.min(viewport.scrollHeight - viewport.clientHeight, viewport.scrollTop + delta),
        );
        viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
      }, deltaY);

    // The desktop app instance is shared across specs, so app.log may already be
    // scrolled from an earlier test. Normalize to the top before asserting.
    await scrollViewportBy(-40 * 300);
    await browser.waitUntil(
      async () => {
        const state = await readViewport();
        return state.selectedLine === "1" && state.scrollTop === 0;
      },
      { interval: 100, timeout: 5_000, timeoutMsg: "Viewport did not normalize to the first line." },
    );

    const initial = await readViewport();
    // The viewport must overflow, otherwise there is no scrolling to verify.
    await expect(initial.maxScrollTop).toBeGreaterThan(0);

    await scrollViewportBy(240);
    await browser.waitUntil(async () => (await readViewport()).scrollTop > 0, {
      interval: 100,
      timeout: 5_000,
      timeoutMsg: "Vertical scrolling did not move the rendered log text.",
    });

    await scrollViewportBy(40 * 300);
    await browser.waitUntil(
      async () => {
        const state = await readViewport();
        return state.selectedLine === "250" && state.hasLastLine && state.scrollTop === state.maxScrollTop;
      },
      { interval: 100, timeout: 5_000, timeoutMsg: "Scrolling did not reach the last loaded line." },
    );

    await scrollViewportBy(-40 * 300);
    await browser.waitUntil(
      async () => {
        const state = await readViewport();
        return state.selectedLine === "1" && state.hasFirstLine && state.scrollTop === 0;
      },
      { interval: 100, timeout: 5_000, timeoutMsg: "Scrolling did not return to the first loaded line." },
    );
  });
});

async function waitForViewportLastNavigation(
  paneTitle: string,
  expectedNavigation: "click" | "keyboard" | "wheel",
): Promise<void> {
  await browser.waitUntil(
    async () =>
      browser.execute((title: string) => {
        const viewport = document
          .querySelector<HTMLElement>(`[aria-label=${JSON.stringify(`Log pane ${title}`)}]`)
          ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

        if (!viewport) {
          throw new Error(`Missing ${title} viewport.`);
        }

        return viewport.dataset.lastNavigation ?? null;
      }, paneTitle).then((lastNavigation) => lastNavigation === expectedNavigation),
    {
      interval: 100,
      timeout: 5_000,
      timeoutMsg: `Expected ${paneTitle} last navigation ${expectedNavigation}.`,
    },
  );
}

async function waitForSelectedLineNumber(paneTitle: string, lineNumber: string): Promise<void> {
  await browser.waitUntil(
    async () =>
      browser.execute((title: string) => {
        const viewport = document
          .querySelector<HTMLElement>(`[aria-label=${JSON.stringify(`Log pane ${title}`)}]`)
          ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

        if (!viewport) {
          throw new Error(`Missing ${title} viewport.`);
        }

        return viewport.dataset.selectedLineNumber ?? null;
      }, paneTitle).then((selectedLineNumber) => selectedLineNumber === lineNumber),
    {
      interval: 100,
      timeout: 5_000,
      timeoutMsg: `Expected ${paneTitle} selected line ${lineNumber}.`,
    },
  );
}

async function waitForRowsToShareVisualTop(
  sourcePaneTitle: string,
  targetPaneTitle: string,
  lineNumber: number,
): Promise<void> {
  await browser.waitUntil(
    async () => {
      const [sourceTop, targetTop] = await Promise.all([
        getRowVisualTop(sourcePaneTitle, lineNumber),
        getRowVisualTop(targetPaneTitle, lineNumber),
      ]);

      return Math.abs(sourceTop - targetTop) <= 1;
    },
    {
      interval: 100,
      timeout: 5_000,
      timeoutMsg: `Expected line ${lineNumber} to share the same visual top in ${sourcePaneTitle} and ${targetPaneTitle}.`,
    },
  );
}

async function getRowVisualTop(paneTitle: string, lineNumber: number): Promise<number> {
  return browser.execute(
    (title: string, rowLineNumber: number) => {
      const pane = document.querySelector<HTMLElement>(`[aria-label=${JSON.stringify(`Log pane ${title}`)}]`);
      const viewport = pane?.querySelector<HTMLElement>('[data-testid="log-viewport"]');
      const row = pane?.querySelector<HTMLElement>(`[data-line-number="${rowLineNumber}"]`);

      if (!viewport || !row) {
        throw new Error(`Missing row ${rowLineNumber} in ${title}.`);
      }

      return Math.round(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top);
    },
    paneTitle,
    lineNumber,
  );
}
