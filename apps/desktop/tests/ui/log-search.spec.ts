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

    const appPane = await getLogPaneByTitle("app.log");
    const servicePane = await getLogPaneByTitle("service.log");
    const directoryPane = await getLogPaneByTitle("app-2026-06-16.log");
    const appSearchTrigger = await appPane.$(byTestId(redesignedShellTestIds.paneHeaderSearch));

    await clickElementWithJavaScript(appSearchTrigger);
    const appSearch = await appPane.$(byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(appSearch).toBeExisting();
    await expectCompactPopoverInsidePane(appPane, appSearch, 90);

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
    await expect(await appPane.$('[data-search-match="true"][data-line-number="181"]')).toBeExisting();
    await expect(await servicePane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchRegex)));
    await setPaneSearchQuery(appSearch, "[broken");
    await expect(await appSearch.$('[role="alert"]')).toHaveText(expect.stringContaining("Invalid regular expression"));
    await pressEscapeInElement(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchField)));
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
    expect(await isFocused(appSearchTrigger)).toBe(true);

    await activatePane(servicePane);
    await clickElementWithJavaScript(await $(byTestId(redesignedShellTestIds.activityRailSearch)));
    await expect(await servicePane.$('[aria-label="Pane search for service.log"]')).toBeExisting();
    await expectCompactPopoverInsidePane(
      servicePane,
      await servicePane.$(byTestId(redesignedShellTestIds.paneSearchPopover)),
      90,
    );
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await activatePane(appPane);
    await focusElementWithJavaScript(await $(byTestId(redesignedShellTestIds.commandField)));
    await expect(await appPane.$('[aria-label="Pane search for app.log"]')).toBeExisting();

    await clickElementWithJavaScript(await directoryPane.$(byTestId(redesignedShellTestIds.paneHeaderSearch)));
    const directorySearch = await directoryPane.$(byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(directorySearch).toBeExisting();
    await expectCompactPopoverInsidePane(directoryPane, directorySearch, 90);
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);
  });
});

async function getLogPaneByTitle(title: string): Promise<WebdriverIO.Element> {
  const pane = await $(
    `${byTestId(redesignedShellTestIds.logPane)}[aria-label=${JSON.stringify(`Log pane ${title}`)}]`,
  );

  await pane.waitForExist();
  return pane;
}

async function activatePane(pane: WebdriverIO.Element): Promise<void> {
  await clickElementWithJavaScript(pane);
  await expect(pane).toHaveAttribute("data-active", "true");
}

async function focusElementWithJavaScript(element: WebdriverIO.Element): Promise<void> {
  await element.waitForExist();
  await browser.execute((target: HTMLElement) => target.focus(), element);
}

async function pressEscapeInElement(element: WebdriverIO.Element): Promise<void> {
  await element.waitForExist();
  await browser.execute((target: HTMLElement) => {
    target.focus();
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
  }, element);
}

async function isFocused(element: WebdriverIO.Element): Promise<boolean> {
  await element.waitForExist();
  return browser.execute((target: HTMLElement) => document.activeElement === target, element);
}

async function expectCompactPopoverInsidePane(
  pane: WebdriverIO.Element,
  popover: WebdriverIO.Element,
  maxHeight: number,
): Promise<void> {
  const bounds = await browser.execute((paneElement: HTMLElement, popoverElement: HTMLElement) => {
    const paneRect = paneElement.getBoundingClientRect();
    const popoverRect = popoverElement.getBoundingClientRect();

    return {
      paneLeft: paneRect.left,
      paneRight: paneRect.right,
      popoverLeft: popoverRect.left,
      popoverRight: popoverRect.right,
      popoverHeight: popoverRect.height,
    };
  }, pane, popover);

  expect(bounds.popoverLeft).toBeGreaterThanOrEqual(bounds.paneLeft - 1);
  expect(bounds.popoverRight).toBeLessThanOrEqual(bounds.paneRight + 1);
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
