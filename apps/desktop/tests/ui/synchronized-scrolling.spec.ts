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
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="3"]'));
    await expect(await panes[0].$('[data-testid="pane-header"]').getAttribute("aria-current")).toBe("true");
    await expect(await statusSummary.getAttribute("data-active-source")).toBe("app.log");
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("true");
    await waitForUiTestTitleFragment("lastNavigation=click");

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
    await waitForUiTestTitleFragment("syncTargetLine=4");

    await browser.execute(() => {
      const viewport = document
        .querySelector<HTMLElement>('[aria-label="Log pane app.log"]')
        ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

      if (!viewport) {
        throw new Error("Missing app.log viewport.");
      }

      viewport.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: 120,
      }));
    });
    await waitForUiTestTitleFragment("lastNavigation=wheel");
    await waitForUiTestTitleFragment("syncTargetLine=7");

    enqueueDesktopUiTestAction("toggleSynchronization");
    await waitForUiTestTitleFragment("sync=off");
    await expect(await statusSummary.getAttribute("data-sync-enabled")).toBe("false");
    await browser.waitUntil(async () => (await syncToggle.getAttribute("aria-pressed")) === "false", {
      interval: 250,
      timeout: 5_000,
      timeoutMsg: "Topbar synchronization button state did not update to off.",
    });
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="4"]'));
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("false");
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

    const wheelViewport = async (deltaY: number) =>
      browser.execute((delta: number) => {
        const viewport = document
          .querySelector<HTMLElement>('[aria-label="Log pane app.log"]')
          ?.querySelector<HTMLElement>('[data-testid="log-viewport"]');

        if (!viewport) {
          throw new Error("Missing app.log viewport.");
        }

        viewport.focus();
        viewport.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: delta }));
      }, deltaY);

    const initial = await readViewport();
    // The viewport must overflow, otherwise there is no scrolling to verify.
    await expect(initial.maxScrollTop).toBeGreaterThan(0);
    await expect(initial.scrollTop).toBe(0);

    await wheelViewport(240);
    await browser.waitUntil(async () => (await readViewport()).scrollTop > 0, {
      interval: 100,
      timeout: 5_000,
      timeoutMsg: "Wheel scrolling did not move the rendered log text.",
    });

    await wheelViewport(40 * 300);
    await browser.waitUntil(
      async () => {
        const state = await readViewport();
        return state.selectedLine === "250" && state.hasLastLine && state.scrollTop === state.maxScrollTop;
      },
      { interval: 100, timeout: 5_000, timeoutMsg: "Scrolling did not reach the last loaded line." },
    );

    await wheelViewport(-40 * 300);
    await browser.waitUntil(
      async () => {
        const state = await readViewport();
        return state.selectedLine === "1" && state.hasFirstLine && state.scrollTop === 0;
      },
      { interval: 100, timeout: 5_000, timeoutMsg: "Scrolling did not return to the first loaded line." },
    );
  });
});
