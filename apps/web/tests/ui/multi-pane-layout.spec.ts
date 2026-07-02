import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

test("opens and manages multiple log panes", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 720 });
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.commandField).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "service.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
  await expect(shell.statusBar).toContainText("3 panes");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-16.log");
  await expectObsoleteControlsAbsent(page);
  await expect(shell.workspaceScrollbar).toBeHidden();
  await expectRightmostPaneAligned(page);
  await waitForWebUiTestTitleFragment(page, "paneOrder=app.log,service.log,app-2026-06-16.log");
  await waitForWebUiTestTitleFragment(page, "maxGutterDigits=3");

  const appViewport = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "app.log" }) })
    .getByTestId("log-viewport");
  await appViewport.focus();
  await page.keyboard.press("ArrowDown");
  await expect(appViewport).toHaveAttribute("data-selected-line-number", "2");
  await waitForWebUiTestTitleFragment(page, "lastNavigation=keyboard");
  await expectHorizontalScrollerReachable(page, "app.log");

  await dragReorderPaneFromHeader(page, "app.log", "service.log");
  await waitForWebUiTestTitleFragment(page, "paneOrder=service.log,app.log,app-2026-06-16.log");
  await clickHeaderSearchWithoutReorder(page, "service.log");
  await expect(page.getByTestId(redesignedShellTestIds.paneSearchPopover)).toBeVisible();
  await waitForWebUiTestTitleFragment(page, "paneOrder=service.log,app.log,app-2026-06-16.log");

  await page.setViewportSize({ width: 960, height: 720 });
  await expect(shell.workspaceScrollbar).toBeVisible();
  const addPaneChooser = page.waitForEvent("filechooser");
  await page.getByTestId("topbar-add-file").click();
  await (await addPaneChooser).setFiles({
    name: "selected-topbar.log",
    mimeType: "text/plain",
    buffer: Buffer.from("2026-06-16T09:10:00.000Z topbar selected source\n"),
  });
  await waitForWebUiTestTitleFragment(page, "sourceEntry=topbar-add-pane");
  await expect(shell.logPanes).toHaveCount(4);

  const appPaneWidthBefore = await paneWidth(page, "app.log");
  await dragResizeBoundary(page, "app.log", 80);
  await expect.poll(() => paneWidth(page, "app.log")).toBeGreaterThan(appPaneWidthBefore);

  await page.getByRole("button", { name: "Close pane service.log" }).click();
  await expect(shell.logPanes).toHaveCount(3);

  await shell.paneWorkspace.evaluate((element) => {
    element.scrollLeft = 120;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(shell.paneWorkspace).toHaveJSProperty("scrollLeft", 120);
  await expect(shell.workspaceScrollbar).toBeVisible();
});

test("opens a selected source from the empty workspace and leaves future controls disabled", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);

  const shell = getRedesignedShell(page);
  await expect(shell.emptyOpenFile).toBeVisible();
  await expect(shell.commandField).toBeDisabled();
  await expect(page.getByTestId("activity-rail-files")).toBeDisabled();
  await expect(page.getByTestId("activity-rail-search")).toBeDisabled();

  const chooser = page.waitForEvent("filechooser");
  await shell.emptyOpenFile.click();
  await (await chooser).setFiles({
    name: "selected-empty.log",
    mimeType: "text/plain",
    buffer: Buffer.from("2026-06-16T09:00:00.000Z selected empty workspace source\n"),
  });

  await expect(page.getByRole("heading", { name: "selected-empty.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "app.log" })).toHaveCount(0);
  await waitForWebUiTestTitleFragment(page, "sourceOpening=opened");
  await waitForWebUiTestTitleFragment(page, "sourceEntry=empty-workspace");
  await waitForWebUiTestTitleFragment(page, "sourceKind=file");
});

async function dragResizeBoundary(page: Parameters<typeof getRedesignedShell>[0], title: string, deltaX: number) {
  const label = `Resize boundary after ${title}`;

  await page.evaluate((boundaryLabel) => {
    const boundary = document.querySelector<HTMLElement>(`[aria-label="${boundaryLabel}"]`);

    if (!boundary) {
      throw new Error(`Missing ${boundaryLabel}.`);
    }

    const rect = boundary.getBoundingClientRect();

    boundary.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      pointerId: 1,
    }));
  }, label);

  await page.waitForTimeout(0);
  await page.evaluate(({ boundaryLabel, dragDeltaX }) => {
    const boundary = document.querySelector<HTMLElement>(`[aria-label="${boundaryLabel}"]`);

    if (!boundary) {
      throw new Error(`Missing ${boundaryLabel}.`);
    }

    const rect = boundary.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      clientX: startX + dragDeltaX,
      clientY: startY,
      pointerId: 1,
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      clientX: startX + dragDeltaX,
      clientY: startY,
      pointerId: 1,
    }));
  }, { boundaryLabel: label, dragDeltaX: deltaX });
}

async function dragReorderPaneFromHeader(
  page: Parameters<typeof getRedesignedShell>[0],
  draggedTitle: string,
  targetTitle: string,
) {
  await page.evaluate(({ draggedPaneTitle }) => {
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
  }, { draggedPaneTitle: draggedTitle });

  await page.waitForTimeout(0);
  await page.evaluate(({ draggedPaneTitle, targetPaneTitle }) => {
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
  }, { draggedPaneTitle: draggedTitle, targetPaneTitle: targetTitle });
}

async function clickHeaderSearchWithoutReorder(
  page: Parameters<typeof getRedesignedShell>[0],
  paneTitle: string,
): Promise<void> {
  await page
    .getByTestId(redesignedShellTestIds.logPane)
    .filter({ has: page.getByRole("heading", { name: paneTitle }) })
    .getByTestId(redesignedShellTestIds.paneHeaderSearch)
    .click();
}

async function paneWidth(page: Parameters<typeof getRedesignedShell>[0], title: string): Promise<number> {
  return page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: title }) })
    .evaluate((element) => element.getBoundingClientRect().width);
}

async function expectHorizontalScrollerReachable(
  page: Parameters<typeof getRedesignedShell>[0],
  title: string,
): Promise<void> {
  const scroller = page.getByRole("region", { name: `Horizontal log scroller for ${title}` });
  const scrollResult = await scroller.evaluate((element) => {
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    element.scrollLeft = Math.min(120, maxScrollLeft);
    element.dispatchEvent(new Event("scroll", { bubbles: true }));

    return { maxScrollLeft, scrollLeft: element.scrollLeft };
  });

  expect(scrollResult.maxScrollLeft).toBeGreaterThan(0);
  expect(scrollResult.scrollLeft).toBeGreaterThan(0);
}

async function expectRightmostPaneAligned(page: Parameters<typeof getRedesignedShell>[0]) {
  await expect
    .poll(async () =>
      page.getByTestId("pane-workspace").evaluate((workspace) => {
        const panes = Array.from(workspace.querySelectorAll<HTMLElement>('[data-testid="log-pane"]'));
        const rightmostPane = panes.at(-1);

        if (!rightmostPane) {
          return Number.POSITIVE_INFINITY;
        }

        return Math.round(workspace.getBoundingClientRect().right - rightmostPane.getBoundingClientRect().right);
      }),
    )
    .toBeLessThanOrEqual(1);
}
