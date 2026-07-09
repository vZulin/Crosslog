import { expect, test, type Locator } from "@playwright/test";
import {
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

test("synchronizes timestamped panes and supports disabling synchronization", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const shell = getRedesignedShell(page);
  const syncToggle = shell.topbar.getByRole("button", { name: "Toggle time synchronization" });
  await expect(syncToggle).toHaveAttribute("aria-pressed", "true");
  await expect(shell.topbar).not.toContainText("Sync on");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-16.log");

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });
  const appViewport = appPane.getByTestId("log-viewport");

  await appPane.locator('[data-line-number="9"]').click();
  await expect(appPane.getByTestId("pane-header")).toHaveAttribute("aria-current", "true");
  await expect(shell.statusBar).toContainText("Active: app.log");
  await expect(servicePane.locator('[data-line-number="9"]')).toHaveAttribute("data-sync-target", "true");
  await expectRowsShareVisualTop(
    appPane.locator('[data-line-number="9"]'),
    servicePane.locator('[data-line-number="9"]'),
  );

  await appViewport.focus();
  await page.keyboard.press("ArrowDown");
  await expect(appViewport).toHaveAttribute("data-selected-line-number", "10");
  await expect(servicePane.locator('[data-line-number="10"]')).toHaveAttribute("data-sync-target", "true");
  await expectRowsShareVisualTop(
    appPane.locator('[data-line-number="10"]'),
    servicePane.locator('[data-line-number="10"]'),
  );
  await expect(appViewport).toHaveAttribute("data-last-navigation", "keyboard");
  await waitForWebUiTestTitleFragment(page, "syncTargetLine=10");

  await scrollViewportBy(appViewport, 4 * 18);
  await expect(appViewport).toHaveAttribute("data-last-navigation", "wheel");
  await expect(appViewport).toHaveAttribute("data-selected-line-number", "10");
  await expect(servicePane.locator('[data-line-number="10"]')).toHaveAttribute("data-sync-target", "true");
  await expectRowsShareVisualTop(
    appPane.locator('[data-line-number="10"]'),
    servicePane.locator('[data-line-number="10"]'),
  );
  await waitForWebUiTestTitleFragment(page, "syncTargetLine=10");

  await syncToggle.click();
  await expect(syncToggle).toHaveAttribute("aria-pressed", "false");
  await expect(shell.topbar).not.toContainText("Sync off");
  await expect(shell.statusBar).toContainText("Sync off");
  await appPane.locator('[data-line-number="9"]').click();
  await expect(servicePane.locator('[data-line-number="10"]')).toHaveAttribute("data-sync-target", "false");
});

test("moves the rendered log text on vertical scroll and reaches the first and last lines", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const appViewport = appPane.getByTestId("log-viewport");
  await appViewport.focus();

  const scrollTop = () => appViewport.evaluate((element) => Math.round(element.scrollTop));
  const maxScrollTop = await appViewport.evaluate((element) => element.scrollHeight - element.clientHeight);
  // The viewport must overflow, otherwise there is no scrolling to verify.
  expect(maxScrollTop).toBeGreaterThan(0);
  expect(await scrollTop()).toBe(0);

  // Native vertical scrolling moves the text, not only the selection indicator.
  await scrollViewportBy(appViewport, 240);
  await expect(appViewport).toHaveAttribute("data-last-navigation", "wheel");
  await expect.poll(scrollTop).toBeGreaterThan(0);

  // The last loaded line is reachable and the text is scrolled to the bottom.
  await scrollViewportToBottom(appViewport);
  await expect(appViewport).toHaveAttribute("data-selected-line-number", "250");
  await expect(appPane.locator('[data-line-number="250"]')).toHaveCount(1);
  await expect.poll(scrollTop).toBe(maxScrollTop);

  // Scrolling back up returns the text to the first loaded line.
  await scrollViewportToTop(appViewport);
  await expect(appViewport).toHaveAttribute("data-selected-line-number", "1");
  await expect(appPane.locator('[data-line-number="1"]')).toHaveCount(1);
  await expect.poll(scrollTop).toBe(0);
});

async function scrollViewportBy(viewport: Locator, deltaY: number): Promise<void> {
  await viewport.evaluate((element, delta) => {
    element.scrollTop = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, element.scrollTop + delta));
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  }, deltaY);
}

async function scrollViewportToBottom(viewport: Locator): Promise<void> {
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight - element.clientHeight;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
}

async function scrollViewportToTop(viewport: Locator): Promise<void> {
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
}

async function expectRowsShareVisualTop(sourceRow: Locator, targetRow: Locator): Promise<void> {
  await expect
    .poll(async () => Math.abs((await getRowVisualTop(sourceRow)) - (await getRowVisualTop(targetRow))))
    .toBeLessThanOrEqual(1);
}

async function getRowVisualTop(row: Locator): Promise<number> {
  return row.evaluate((element) => {
    const viewport = element.closest<HTMLElement>('[data-testid="log-viewport"]');

    if (!viewport) {
      throw new Error("Missing viewport for log row.");
    }

    return Math.round(element.getBoundingClientRect().top - viewport.getBoundingClientRect().top);
  });
}
