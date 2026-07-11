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
    const appSearchTrigger = await getPaneElement(appPaneTitle, byTestId(redesignedShellTestIds.paneHeaderSearch));

    await clickElementWithJavaScript(appSearchTrigger);
    const appSearch = await getPaneElement(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(appSearch).toBeExisting();
    await expectCompactPopoverInsidePane(appPaneTitle, appSearch, 90);

    await setPaneSearchQuery(appSearch, "line");
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText(
      expect.stringContaining("1 of"),
    );
    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchNext)));
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText(
      expect.stringContaining("2 of"),
    );

    await setPaneSearchQuery(appSearch, "line 180 token=outside-viewport");
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("1 of 1");
    const outsideViewportLine = await getPaneElement(appPaneTitle, '[data-line-number="181"]');
    await expect(outsideViewportLine).toBeExisting();
    expect(await outsideViewportLine.getAttribute("data-search-match")).toBeNull();
    await waitForPaneSearchHighlight(appPaneTitle, 181, "line 180 token=outside-viewport");
    await expect(await getPaneElements(servicePaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(
      0,
    );

    await pressEscapeInElement(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchField)));
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
    expect(await isFocused(appSearchTrigger)).toBe(true);
    await expect(await getPaneElements(appPaneTitle, '[data-search-highlight="true"]')).toHaveLength(0);

    await clickElementWithJavaScript(appSearchTrigger);
    const regexSearch = await getPaneElement(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(regexSearch).toBeExisting();
    await clickElementWithJavaScript(await regexSearch.$(byTestId(redesignedShellTestIds.paneSearchRegex)));
    await setPaneSearchQuery(regexSearch, "[broken");
    await expect(await regexSearch.$('[role="alert"]')).toHaveText(expect.stringContaining("Invalid regular expression"));
    await pressEscapeInElement(await regexSearch.$(byTestId(redesignedShellTestIds.paneSearchField)));
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
    expect(await isFocused(appSearchTrigger)).toBe(true);
    await expect(await getPaneElements(appPaneTitle, '[data-search-highlight="true"]')).toHaveLength(0);

    await activatePane(servicePaneTitle);
    await expect(await $(byTestId(redesignedShellTestIds.activityRailSearch))).toBeDisabled();
    await expect(await getLogPaneByTitle(servicePaneTitle).$('[aria-label="Pane search for service.log"]')).not.toBeExisting();
    await expect(await getPaneElements(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await activatePane(appPaneTitle);
    await expect(await $(byTestId(redesignedShellTestIds.commandField))).toBeDisabled();
    await expect(await getLogPaneByTitle(appPaneTitle).$('[aria-label="Pane search for app.log"]')).not.toBeExisting();

    await clickElementWithJavaScript(
      await getPaneElement(directoryPaneTitle, byTestId(redesignedShellTestIds.paneHeaderSearch)),
    );
    const directorySearch = await getPaneElement(directoryPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(directorySearch).toBeExisting();
    await expectCompactPopoverInsidePane(directoryPaneTitle, directorySearch, 90);
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
    const appSearch = await getPaneElement(appPaneTitle, byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(appSearch).toBeExisting();

    await setPaneSearchQuery(appSearch, "app.log");
    await waitForPaneSearchHighlight(appPaneTitle, 1, "app.log", true);
    const visibleMatchStart = await readPaneSearchScrollMetrics(appPaneTitle);
    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchNext)));
    await waitForPaneSearchHighlight(appPaneTitle, 2, "app.log", true);
    const visibleMatchNext = await readPaneSearchScrollMetrics(appPaneTitle);

    expect(visibleMatchNext.viewportScrollTop).toBe(visibleMatchStart.viewportScrollTop);
    expect(visibleMatchNext.scrollerScrollLeft).toBe(visibleMatchStart.scrollerScrollLeft);

    await setPaneSearchQuery(appSearch, "outside-viewport");
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

    await setPaneSearchQuery(appSearch, "");
    await resetPaneHorizontalScroll(appPaneTitle);
    const horizontalOnlyStart = await readPaneSearchScrollMetrics(appPaneTitle);
    await setPaneSearchQuery(appSearch, "outside-viewport");
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

async function activatePane(title: string): Promise<void> {
  const pane = await getLogPaneByTitle(title);

  await clickElementWithJavaScript(pane);
  await expect(pane).toHaveAttribute("data-active", "true");
}

async function pressEscapeInElement(element: WebdriverIO.Element): Promise<void> {
  await element.waitForExist();
  await browser.execute((target: HTMLElement) => {
    target.focus();
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
  }, element);
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
  await browser.waitUntil(
    async () =>
      browser.execute(
        (paneElement: HTMLElement, targetLineNumber: number, text: string, activeOnly: boolean) => {
          const highlight = paneElement.querySelector<HTMLElement>(
            `[data-line-number="${targetLineNumber}"] [data-search-highlight="true"]${
              activeOnly ? '[data-active-search-highlight="true"]' : ""
            }`,
          );

          return (highlight?.textContent ?? "").replace(/\s+/g, " ").trim() === text;
        },
        await getLogPaneByTitle(title),
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

async function expectCompactPopoverInsidePane(
  title: string,
  popover: WebdriverIO.Element,
  maxHeight: number,
): Promise<void> {
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
  }, await getLogPaneByTitle(title), popover);

  expect(bounds.popoverLeft).toBeGreaterThanOrEqual(bounds.paneLeft - 1);
  expect(bounds.popoverRight).toBeLessThanOrEqual(bounds.paneRight + 1);
  expect(bounds.popoverTop).toBeGreaterThanOrEqual(bounds.paneHeaderBottom - 1);
  expect(bounds.popoverHeight).toBeLessThan(maxHeight);
}

async function setPaneSearchQuery(searchPopover: WebdriverIO.Element, query: string): Promise<void> {
  const searchField = await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchField));

  await searchField.waitForExist();
  await browser.execute(
    (target: HTMLInputElement, nextQuery: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

      valueSetter?.call(target, nextQuery);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    },
    searchField,
    query,
  );
  await expect(searchField).toHaveValue(query);
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
