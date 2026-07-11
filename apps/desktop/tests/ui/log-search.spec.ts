import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop log search", () => {
  it("searches from the pane popover and isolates pane search state", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPaneTitle = "app.log";
    const servicePaneTitle = "service.log";
    const directoryPaneTitle = "app-2026-06-16.log";
    const appSearchTriggerSelector = byTestId(redesignedShellTestIds.paneHeaderSearch);

    await clickElementWithJavaScript(await getPaneElement(appPaneTitle, appSearchTriggerSelector));
    await expect(await getPaneSearchPopover(appPaneTitle)).toBeExisting();
    await expectCompactPopoverInsidePane(appPaneTitle, 90);

    await setPaneSearchQuery(appPaneTitle, "line");
    await expectPaneSearchMatchCountToContain(appPaneTitle, "1 of");
    await clickPaneSearchControl(appPaneTitle, redesignedShellTestIds.paneSearchNext);
    await expectPaneSearchMatchCountToContain(appPaneTitle, "2 of");

    await setPaneSearchQuery(appPaneTitle, "line 180 token=outside-viewport");
    await expectPaneSearchMatchCountToBe(appPaneTitle, "1 of 1");
    await waitForPaneSearchHighlight(appPaneTitle, 181, "line 180 token=outside-viewport");
    await expect(await getPaneElements(servicePaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(
      0,
    );

    await pressEscapeInPaneSearchField(appPaneTitle);
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
    expect(await isFocused(await getPaneElement(appPaneTitle, appSearchTriggerSelector))).toBe(true);
    await expect(await getPaneElements(appPaneTitle, '[data-search-highlight="true"]')).toHaveLength(0);

    await clickElementWithJavaScript(await getPaneElement(appPaneTitle, appSearchTriggerSelector));
    await expect(await getPaneSearchPopover(appPaneTitle)).toBeExisting();
    await clickPaneSearchControl(appPaneTitle, redesignedShellTestIds.paneSearchRegex);
    await setPaneSearchQuery(appPaneTitle, "[broken");
    await expect(await getPaneSearchAlert(appPaneTitle)).toHaveText(expect.stringContaining("Invalid regular expression"));
    await pressEscapeInPaneSearchField(appPaneTitle);
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
    expect(await isFocused(await getPaneElement(appPaneTitle, appSearchTriggerSelector))).toBe(true);
    await expect(await getPaneElements(appPaneTitle, '[data-search-highlight="true"]')).toHaveLength(0);

    await activatePane(servicePaneTitle);
    await expect(await $(byTestId(redesignedShellTestIds.activityRailSearch))).toBeDisabled();
    await expect(await getPaneElements(servicePaneTitle, '[aria-label="Pane search for service.log"]')).toHaveLength(0);
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await activatePane(appPaneTitle);
    await expect(await $(byTestId(redesignedShellTestIds.commandField))).toBeDisabled();
    await expect(await getPaneElements(appPaneTitle, '[aria-label="Pane search for app.log"]')).toHaveLength(0);

    await clickElementWithJavaScript(
      await getPaneElement(directoryPaneTitle, byTestId(redesignedShellTestIds.paneHeaderSearch)),
    );
    await expect(await getPaneSearchPopover(directoryPaneTitle)).toBeExisting();
    await expectCompactPopoverInsidePane(directoryPaneTitle, 90);
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
  });

  it("opens the active pane search popover content from the platform shortcut", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPaneTitle = "app.log";
    const servicePaneTitle = "service.log";

    await activatePane(servicePaneTitle);

    const defaultPrevented = await pressPlatformSearchShortcut();

    expect(defaultPrevented).toBe(true);
    await expect(await getPaneElement(servicePaneTitle, ".crosslog-pane-search-popover__content")).toBeExisting();
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(
      0,
    );
  });

  it("keeps visible search matches stationary and centers hidden matches", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPaneTitle = "app.log";
    await clickElementWithJavaScript(await getPaneElement(appPaneTitle, byTestId(redesignedShellTestIds.paneHeaderSearch)));
    await expect(await getPaneSearchPopover(appPaneTitle)).toBeExisting();

    await setPaneSearchQuery(appPaneTitle, "app.log");
    await waitForPaneSearchHighlight(appPaneTitle, 1, "app.log", true);
    const visibleMatchStart = await readPaneSearchScrollMetrics(appPaneTitle);
    await clickPaneSearchControl(appPaneTitle, redesignedShellTestIds.paneSearchNext);
    await waitForPaneSearchHighlight(appPaneTitle, 2, "app.log", true);
    const visibleMatchNext = await readPaneSearchScrollMetrics(appPaneTitle);

    expect(visibleMatchNext.viewportScrollTop).toBe(visibleMatchStart.viewportScrollTop);
    expect(visibleMatchNext.scrollerScrollLeft).toBe(visibleMatchStart.scrollerScrollLeft);

    await setPaneSearchQuery(appPaneTitle, "outside-viewport");
    await waitForPaneSearchHighlight(appPaneTitle, 181, "outside-viewport", true);
    await browser.waitUntil(async () => (await readPaneSearchGeometry(appPaneTitle)).viewportScrollTop > 0, {
      timeout: 15_000,
      timeoutMsg: "Search navigation did not move vertically.",
    });
    await browser.waitUntil(async () => (await readPaneSearchGeometry(appPaneTitle)).scrollerScrollLeft > 0, {
      timeout: 15_000,
      timeoutMsg: "Search navigation did not move horizontally.",
    });
    await browser.waitUntil(
      async () => Math.abs((await readPaneSearchGeometry(appPaneTitle)).highlightCenterDeltaY) <= 20,
      {
        timeout: 15_000,
        timeoutMsg: "Active search highlight did not center vertically.",
      },
    );

    await setPaneSearchQuery(appPaneTitle, "");
    await resetPaneHorizontalScroll(appPaneTitle);
    const horizontalOnlyStart = await readPaneSearchScrollMetrics(appPaneTitle);
    await setPaneSearchQuery(appPaneTitle, "outside-viewport");
    await waitForPaneSearchHighlight(appPaneTitle, 181, "outside-viewport", true);
    const horizontalOnlyEnd = await readPaneSearchScrollMetrics(appPaneTitle);

    expect(horizontalOnlyEnd.viewportScrollTop).toBe(horizontalOnlyStart.viewportScrollTop);
    expect(horizontalOnlyEnd.scrollerScrollLeft).toBeGreaterThan(horizontalOnlyStart.scrollerScrollLeft);
  });
});

async function getLogPaneByTitle(title: string): Promise<WebdriverIO.Element> {
  const pane = await $(getPaneSelectorByTitle(title));

  await pane.waitForExist();
  return pane;
}

function getPaneSelectorByTitle(title: string): string {
  return `${byTestId(redesignedShellTestIds.logPane)}[aria-label=${JSON.stringify(`Log pane ${title}`)}]`;
}

async function getPaneElement(title: string, selector: string): Promise<WebdriverIO.Element> {
  const element = await $(`${getPaneSelectorByTitle(title)} ${selector}`);

  await element.waitForExist();
  return element;
}

async function getPaneElements(title: string, selector: string): Promise<WebdriverIO.ElementArray> {
  return $$(`${getPaneSelectorByTitle(title)} ${selector}`);
}

async function getPaneSearchPopover(title: string): Promise<WebdriverIO.Element> {
  return getPaneElement(title, byTestId(redesignedShellTestIds.paneSearchPopover));
}

async function getPaneSearchAlert(title: string): Promise<WebdriverIO.Element> {
  return getPaneElement(title, '[role="alert"]');
}

async function activatePane(title: string): Promise<void> {
  const pane = await getLogPaneByTitle(title);

  await clickElementWithJavaScript(pane);
  await expect(pane).toHaveAttribute("data-active", "true");
}

async function pressEscapeInPaneSearchField(title: string): Promise<void> {
  const paneSelector = getPaneSelectorByTitle(title);

  await browser.waitUntil(
    async () =>
      browser.execute(
        (selector: string, fieldTestId: string) => {
          const pane = document.querySelector<HTMLElement>(selector);
          const searchField = pane?.querySelector<HTMLInputElement>(`[data-testid="${fieldTestId}"]`);

          if (!searchField) {
            return false;
          }

          searchField.focus();
          searchField.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
          return true;
        },
        paneSelector,
        redesignedShellTestIds.paneSearchField,
      ),
    {
      interval: 100,
      timeout: 15_000,
      timeoutMsg: `Pane search field did not accept Escape for ${title}`,
    },
  );
}

async function pressPlatformSearchShortcut(): Promise<boolean> {
  return browser.execute(() => {
    const platformVariant =
      document.querySelector<HTMLElement>('[data-testid="crosslog-shell"]')?.dataset.platform ?? "macos";
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "f",
      ctrlKey: platformVariant === "windows" || platformVariant === "linux",
      metaKey: platformVariant === "macos",
    });

    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
}

async function isFocused(element: WebdriverIO.Element): Promise<boolean> {
  await element.waitForExist();
  return browser.execute((target: HTMLElement) => document.activeElement === target, element);
}

async function waitForPaneSearchHighlight(
  title: string,
  lineNumber: number,
  expectedText: string,
  active = false,
): Promise<void> {
  const paneSelector = getPaneSelectorByTitle(title);

  await browser.waitUntil(
    async () =>
      browser.execute(
        (selector: string, targetLineNumber: number, text: string, activeOnly: boolean) => {
          const paneElement = document.querySelector<HTMLElement>(selector);

          if (!paneElement) {
            return false;
          }

          const highlightSelector = `[data-line-number="${targetLineNumber}"] [data-search-highlight="true"]${
            activeOnly ? '[data-active-search-highlight="true"]' : ""
          }`;
          const highlight = paneElement.querySelector<HTMLElement>(highlightSelector);

          return (highlight?.textContent ?? "").replace(/\s+/g, " ").trim() === text;
        },
        paneSelector,
        lineNumber,
        expectedText,
        active,
      ),
    {
      interval: 100,
      timeout: 15_000,
      timeoutMsg: `Search highlight did not render on line ${lineNumber}: ${expectedText}`,
    },
  );
}

async function expectCompactPopoverInsidePane(title: string, maxHeight: number): Promise<void> {
  const bounds = await browser.execute((paneElement: HTMLElement, popoverElement: HTMLElement) => {
    const paneRect = paneElement.getBoundingClientRect();
    const paneHeaderRect = paneElement.querySelector<HTMLElement>('[data-testid="pane-header"]')?.getBoundingClientRect();
    const popoverRect = popoverElement.getBoundingClientRect();

    if (!paneHeaderRect) {
      throw new Error("Missing pane header while checking popover placement.");
    }

    return {
      paneLeft: paneRect.left,
      paneRight: paneRect.right,
      paneHeaderBottom: paneHeaderRect.bottom,
      popoverLeft: popoverRect.left,
      popoverRight: popoverRect.right,
      popoverTop: popoverRect.top,
      popoverHeight: popoverRect.height,
    };
  }, await getLogPaneByTitle(title), await getPaneSearchPopover(title));

  expect(bounds.popoverLeft).toBeGreaterThanOrEqual(bounds.paneLeft - 1);
  expect(bounds.popoverRight).toBeLessThanOrEqual(bounds.paneRight + 1);
  expect(bounds.popoverTop).toBeGreaterThanOrEqual(bounds.paneHeaderBottom - 1);
  expect(bounds.popoverHeight).toBeLessThan(maxHeight);
}

async function setPaneSearchQuery(title: string, query: string): Promise<void> {
  const paneSelector = getPaneSelectorByTitle(title);

  await browser.waitUntil(
    async () =>
      browser.execute(
        (selector: string, fieldTestId: string, nextQuery: string) => {
          const pane = document.querySelector<HTMLElement>(selector);
          const searchField = pane?.querySelector<HTMLInputElement>(`[data-testid="${fieldTestId}"]`);

          if (!searchField) {
            return false;
          }

          const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

          valueSetter?.call(searchField, nextQuery);
          searchField.dispatchEvent(new Event("input", { bubbles: true }));
          searchField.dispatchEvent(new Event("change", { bubbles: true }));
          return searchField.value === nextQuery;
        },
        paneSelector,
        redesignedShellTestIds.paneSearchField,
        query,
      ),
    {
      interval: 100,
      timeout: 15_000,
      timeoutMsg: `Pane search field did not accept query for ${title}: ${query}`,
    },
  );
}

async function clickPaneSearchControl(title: string, testId: string): Promise<void> {
  const paneSelector = getPaneSelectorByTitle(title);

  await browser.waitUntil(
    async () =>
      browser.execute(
        (selector: string, controlTestId: string) => {
          const pane = document.querySelector<HTMLElement>(selector);
          const control = pane?.querySelector<HTMLElement>(`[data-testid="${controlTestId}"]`);

          if (!control) {
            return false;
          }

          control.click();
          return true;
        },
        paneSelector,
        testId,
      ),
    {
      interval: 100,
      timeout: 15_000,
      timeoutMsg: `Pane search control did not become available for ${title}: ${testId}`,
    },
  );
}

async function readPaneSearchMatchCount(title: string): Promise<string | null> {
  return browser.execute(
    (selector: string, matchCountTestId: string) =>
      document
        .querySelector<HTMLElement>(`${selector} [data-testid="${matchCountTestId}"]`)
        ?.textContent?.replace(/\s+/g, " ")
        .trim() ?? null,
    getPaneSelectorByTitle(title),
    redesignedShellTestIds.paneSearchMatchCount,
  );
}

async function expectPaneSearchMatchCountToContain(title: string, expectedText: string): Promise<void> {
  await browser.waitUntil(async () => (await readPaneSearchMatchCount(title))?.includes(expectedText) === true, {
    interval: 100,
    timeout: 15_000,
    timeoutMsg: `Pane search match count did not contain "${expectedText}" for ${title}`,
  });
}

async function expectPaneSearchMatchCountToBe(title: string, expectedText: string): Promise<void> {
  await browser.waitUntil(async () => (await readPaneSearchMatchCount(title)) === expectedText, {
    interval: 100,
    timeout: 15_000,
    timeoutMsg: `Pane search match count did not equal "${expectedText}" for ${title}`,
  });
}

async function readPaneSearchScrollMetrics(title: string): Promise<{
  viewportScrollTop: number;
  scrollerScrollLeft: number;
}> {
  return browser.execute((paneElement: HTMLElement) => {
    const viewport = paneElement.querySelector<HTMLElement>('[data-testid="log-viewport"]');
    const scroller = paneElement.querySelector<HTMLElement>(".crosslog-log-scroller");

    if (!viewport || !scroller) {
      throw new Error("Missing viewport or scroller.");
    }

    return {
      viewportScrollTop: Math.round(viewport.scrollTop),
      scrollerScrollLeft: Math.round(scroller.scrollLeft),
    };
  }, await getLogPaneByTitle(title));
}

async function resetPaneHorizontalScroll(title: string): Promise<void> {
  await browser.execute((paneElement: HTMLElement) => {
    const scroller = paneElement.querySelector<HTMLElement>(".crosslog-log-scroller");

    if (!scroller) {
      throw new Error("Missing scroller.");
    }

    scroller.scrollLeft = 0;
    scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
  }, await getLogPaneByTitle(title));
}

async function readPaneSearchGeometry(title: string): Promise<{
  viewportScrollTop: number;
  scrollerScrollLeft: number;
  highlightCenterDeltaX: number;
  highlightCenterDeltaY: number;
}> {
  return browser.execute((paneElement: HTMLElement) => {
    const viewport = paneElement.querySelector<HTMLElement>('[data-testid="log-viewport"]');
    const scroller = paneElement.querySelector<HTMLElement>(".crosslog-log-scroller");
    const frame = paneElement.querySelector<HTMLElement>(".crosslog-log-scroller__viewport-frame");
    const highlight = paneElement.querySelector<HTMLElement>('[data-active-search-highlight="true"]');

    if (!viewport || !scroller || !frame || !highlight) {
      throw new Error("Missing viewport, scroller, frame, or active highlight.");
    }

    const viewportRect = viewport.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const highlightRect = highlight.getBoundingClientRect();

    return {
      viewportScrollTop: Math.round(viewport.scrollTop),
      scrollerScrollLeft: Math.round(scroller.scrollLeft),
      highlightCenterDeltaX: Math.round(
        highlightRect.left + highlightRect.width / 2 - (frameRect.left + frameRect.width / 2),
      ),
      highlightCenterDeltaY: Math.round(
        highlightRect.top + highlightRect.height / 2 - (viewportRect.top + viewport.clientHeight / 2),
      ),
    };
  }, await getLogPaneByTitle(title));
}
