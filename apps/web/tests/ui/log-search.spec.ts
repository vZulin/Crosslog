import { expect, test, type Locator } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  shellPresentationUrl,
} from "./helpers/redesigned-shell";

test("searches from the pane popover and isolates pane search state", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const activityRail = page.getByTestId(redesignedShellTestIds.activityRail);
  const commandField = page.getByTestId(redesignedShellTestIds.commandField);
  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });
  const directoryPane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "app-2026-06-16.log" }) });

  const appSearchTrigger = appPane.getByRole("button", { name: "Search in app.log" });
  await appSearchTrigger.click();
  const appSearch = appPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await expect(appSearch).toBeVisible();
  await expectCompactPopoverInsidePane(appPane, appSearch, 90);

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("line ");
  await expect(appSearch.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toContainText("1 of");
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchNext).click();
  await expect(appSearch.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toContainText("2 of");

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("line 180 token=outside-viewport");
  await expect(appSearch.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toHaveText("1 of 1");
  const outsideViewportLine = appPane.locator('[data-line-number="181"]');
  await expect(outsideViewportLine).toBeVisible();
  await expect(outsideViewportLine).not.toHaveAttribute("data-search-match", "true");
  await expect(outsideViewportLine.locator('[data-search-highlight="true"]')).toHaveText(
    "line 180 token=outside-viewport",
  );
  await expect(servicePane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(appSearch).toHaveCount(0);
  await expect(appSearchTrigger).toBeFocused();
  await expect(appPane.locator('[data-search-highlight="true"]')).toHaveCount(0);

  await appSearchTrigger.click();
  await expect(appSearch).toBeVisible();
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchRegex).check();
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("[broken");
  await expect(appSearch.getByRole("alert")).toContainText("Invalid regular expression");
  await page.keyboard.press("Escape");
  await expect(appSearch).toHaveCount(0);
  await expect(appSearchTrigger).toBeFocused();
  await expect(appPane.locator('[data-search-highlight="true"]')).toHaveCount(0);

  await expect(activityRail.getByTestId(redesignedShellTestIds.activityRailSearch)).toBeDisabled();
  await servicePane.click();
  await expect(servicePane.getByRole("dialog", { name: "Pane search for service.log" })).toHaveCount(0);

  await expect(commandField).toBeDisabled();
  await expect(appPane.getByRole("dialog", { name: "Pane search for app.log" })).toHaveCount(0);

  await directoryPane.getByRole("button", { name: "Search in app-2026-06-16.log" }).click();
  const directorySearch = directoryPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await expect(directorySearch).toBeVisible();
  await expectCompactPopoverInsidePane(directoryPane, directorySearch, 90);
  await expect(appPane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);
});

test("search navigation keeps visible matches stationary and centers hidden matches", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  await appPane.getByRole("button", { name: "Search in app.log" }).click();
  const appSearch = appPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await expect(appSearch).toBeVisible();

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("app.log");
  await waitForActiveSearchHighlight(appPane, 1, "app.log");
  const visibleMatchStart = await readPaneSearchScrollMetrics(appPane);
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchNext).click();
  await waitForActiveSearchHighlight(appPane, 2, "app.log");
  const visibleMatchNext = await readPaneSearchScrollMetrics(appPane);

  expect(visibleMatchNext.viewportScrollTop).toBe(visibleMatchStart.viewportScrollTop);
  expect(visibleMatchNext.scrollerScrollLeft).toBe(visibleMatchStart.scrollerScrollLeft);

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("outside-viewport");
  await waitForActiveSearchHighlight(appPane, 181, "outside-viewport");
  await expect.poll(async () => (await readPaneSearchGeometry(appPane)).viewportScrollTop).toBeGreaterThan(0);
  await expect.poll(async () => (await readPaneSearchGeometry(appPane)).scrollerScrollLeft).toBeGreaterThan(0);
  await expect
    .poll(async () => Math.abs((await readPaneSearchGeometry(appPane)).highlightCenterDeltaY))
    .toBeLessThanOrEqual(20);

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("");
  await resetPaneHorizontalScroll(appPane);
  const horizontalOnlyStart = await readPaneSearchScrollMetrics(appPane);
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("outside-viewport");
  await waitForActiveSearchHighlight(appPane, 181, "outside-viewport");
  const horizontalOnlyEnd = await readPaneSearchScrollMetrics(appPane);

  expect(horizontalOnlyEnd.viewportScrollTop).toBe(horizontalOnlyStart.viewportScrollTop);
  expect(horizontalOnlyEnd.scrollerScrollLeft).toBeGreaterThan(horizontalOnlyStart.scrollerScrollLeft);
});

test.describe("pane search shortcuts", () => {
  for (const scenario of [
    { name: "macOS", platform: "macos" as const, modifier: "meta" as const },
    { name: "Windows", platform: "windows" as const, modifier: "control" as const },
    { name: "Linux", platform: "linux" as const, modifier: "control" as const },
  ]) {
    test(`opens the active pane search popover content with ${scenario.name} shortcut`, async ({ page }) => {
      await page.goto(shellPresentationUrl("/", { platform: scenario.platform, uiTestBridge: true }));
      await openSampleLogsWithWebUiBridge(page);

      const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
      const servicePane = page
        .getByTestId("log-pane")
        .filter({ has: page.getByRole("heading", { name: "service.log" }) });

      await servicePane.click();
      await expect(servicePane).toHaveAttribute("data-active", "true");

      const defaultPrevented = await page.evaluate((modifier) => {
        const event = new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "f",
          ctrlKey: modifier === "control",
          metaKey: modifier === "meta",
        });

        window.dispatchEvent(event);
        return event.defaultPrevented;
      }, scenario.modifier);

      expect(defaultPrevented).toBe(true);
      await expect(servicePane.locator(".crosslog-pane-search-popover__content")).toBeVisible();
      await expect(appPane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);
    });
  }
});

async function expectCompactPopoverInsidePane(
  pane: Locator,
  popover: Locator,
  maxHeight: number,
): Promise<void> {
  const paneBox = await pane.boundingBox();
  const paneHeaderBox = await pane.getByTestId(redesignedShellTestIds.paneHeader).boundingBox();
  const popoverBox = await popover.boundingBox();

  expect(paneBox, "pane bounds").not.toBeNull();
  expect(paneHeaderBox, "pane header bounds").not.toBeNull();
  expect(popoverBox, "popover bounds").not.toBeNull();

  if (!paneBox || !paneHeaderBox || !popoverBox) {
    return;
  }

  expect(popoverBox.x).toBeGreaterThanOrEqual(paneBox.x - 1);
  expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(paneBox.x + paneBox.width + 1);
  expect(popoverBox.y).toBeGreaterThanOrEqual(paneHeaderBox.y + paneHeaderBox.height - 1);
  expect(popoverBox.height).toBeLessThan(maxHeight);
}

async function waitForActiveSearchHighlight(
  pane: Locator,
  lineNumber: number,
  text: string,
): Promise<void> {
  await expect
    .poll(async () => {
      return pane.evaluate((paneElement, expected) => {
        const highlight = paneElement.querySelector<HTMLElement>(
          `[data-line-number="${expected.lineNumber}"] [data-active-search-highlight="true"]`,
        );

        return (highlight?.textContent ?? "").replace(/\s+/g, " ").trim();
      }, { lineNumber, text })
    })
    .toBe(text);
}

async function readPaneSearchScrollMetrics(pane: Locator): Promise<{
  viewportScrollTop: number;
  scrollerScrollLeft: number;
}> {
  return pane.evaluate((paneElement) => {
    const viewport = paneElement.querySelector<HTMLElement>('[data-testid="log-viewport"]');
    const scroller = paneElement.querySelector<HTMLElement>(".crosslog-log-scroller");

    if (!viewport || !scroller) {
      throw new Error("Missing viewport or scroller.");
    }

    return {
      viewportScrollTop: Math.round(viewport.scrollTop),
      scrollerScrollLeft: Math.round(scroller.scrollLeft),
    };
  });
}

async function resetPaneHorizontalScroll(pane: Locator): Promise<void> {
  await pane.evaluate((paneElement) => {
    const scroller = paneElement.querySelector<HTMLElement>(".crosslog-log-scroller");

    if (!scroller) {
      throw new Error("Missing scroller.");
    }

    scroller.scrollLeft = 0;
    scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
}

async function readPaneSearchGeometry(pane: Locator): Promise<{
  viewportScrollTop: number;
  scrollerScrollLeft: number;
  highlightCenterDeltaX: number;
  highlightCenterDeltaY: number;
}> {
  return pane.evaluate((paneElement) => {
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
  });
}
