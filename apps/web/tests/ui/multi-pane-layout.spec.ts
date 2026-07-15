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
  await expect.poll(async () => {
    return shell.paneWorkspace.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  }).toBe(true);
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
});

test("shows the pane reorder outline on the current slot and moves it only after crossing the next midpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 720 });
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  await beginPaneReorderDragFromHeader(page, "app.log");
  await expect(page.getByTestId(redesignedShellTestIds.paneReorderOutline)).toBeVisible();

  const appRect = await paneRect(page, "app.log");
  const serviceRect = await paneRect(page, "service.log");
  const serviceViewportRect = await paneViewportRect(page, "service.log");
  const serviceMidpoint = serviceViewportRect.left + serviceViewportRect.width / 2;

  expect(await reorderOutlineRect(page)).toMatchObject({
    left: appRect.left,
    width: appRect.width,
  });

  await movePaneReorderDrag(page, serviceMidpoint - 8);
  expect(await reorderOutlineRect(page)).toMatchObject({
    left: appRect.left,
    width: appRect.width,
  });

  await movePaneReorderDrag(page, serviceMidpoint + 8);
  expect(await reorderOutlineRect(page)).toMatchObject({
    left: serviceRect.left,
    width: appRect.width,
  });

  await finishPaneReorderDrag(page, serviceMidpoint + 8);
  await waitForWebUiTestTitleFragment(page, "paneOrder=service.log,app.log,app-2026-06-16.log");
  await expect(page.getByTestId(redesignedShellTestIds.paneReorderOutline)).toHaveCount(0);
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
  await beginPaneReorderDragFromHeader(page, draggedTitle);
  await movePaneReorderDragToPane(page, targetTitle, 0.75);
  await finishPaneReorderDragToPane(page, targetTitle, 0.75);
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

async function beginPaneReorderDragFromHeader(
  page: Parameters<typeof getRedesignedShell>[0],
  draggedTitle: string,
) {
  await page.evaluate(({ draggedPaneTitle, paneHeaderTestId, paneTestId }) => {
    const draggedPane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (pane) => pane.getAttribute("aria-label") === `Log pane ${draggedPaneTitle}`,
    );
    const draggedHeader = draggedPane?.querySelector<HTMLElement>(`[data-testid="${paneHeaderTestId}"]`);
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
  }, {
    draggedPaneTitle: draggedTitle,
    paneHeaderTestId: redesignedShellTestIds.paneHeader,
    paneTestId: redesignedShellTestIds.logPane,
  });

  await page.waitForTimeout(0);
}

async function movePaneReorderDrag(page: Parameters<typeof getRedesignedShell>[0], clientX: number) {
  await page.evaluate((nextClientX) => {
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      clientX: nextClientX,
      clientY: 24,
      pointerId: 9,
    }));
  }, clientX);
}

async function finishPaneReorderDrag(page: Parameters<typeof getRedesignedShell>[0], clientX: number) {
  await page.evaluate((nextClientX) => {
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      clientX: nextClientX,
      clientY: 24,
      pointerId: 9,
    }));
  }, clientX);
}

async function movePaneReorderDragToPane(
  page: Parameters<typeof getRedesignedShell>[0],
  targetTitle: string,
  horizontalFraction: number,
) {
  const targetClientX = await page.evaluate(({ paneTitle, paneTestId, fraction }) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );

    if (!pane) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    const rect = pane.getBoundingClientRect();
    return rect.left + rect.width * fraction;
  }, { paneTitle: targetTitle, paneTestId: redesignedShellTestIds.logPane, fraction: horizontalFraction });
  await movePaneReorderDrag(page, targetClientX);
}

async function finishPaneReorderDragToPane(
  page: Parameters<typeof getRedesignedShell>[0],
  targetTitle: string,
  horizontalFraction: number,
) {
  const targetClientX = await page.evaluate(({ paneTitle, paneTestId, fraction }) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );

    if (!pane) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    const rect = pane.getBoundingClientRect();
    return rect.left + rect.width * fraction;
  }, { paneTitle: targetTitle, paneTestId: redesignedShellTestIds.logPane, fraction: horizontalFraction });
  await finishPaneReorderDrag(page, targetClientX);
}

async function paneRect(page: Parameters<typeof getRedesignedShell>[0], title: string): Promise<{
  left: number;
  width: number;
}> {
  return page.evaluate(({ paneTitle, paneTestId, paneRailTestId }) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );
    const paneRail = document.querySelector<HTMLElement>(`[data-testid="${paneRailTestId}"]`);

    if (!pane || !paneRail) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    const rect = pane.getBoundingClientRect();
    const paneRailRect = paneRail.getBoundingClientRect();
    return { left: rect.left - paneRailRect.left, width: rect.width };
  }, {
    paneTitle: title,
    paneTestId: redesignedShellTestIds.logPane,
    paneRailTestId: "pane-rail",
  });
}

async function reorderOutlineRect(page: Parameters<typeof getRedesignedShell>[0]): Promise<{
  left: number;
  width: number;
}> {
  return page.evaluate(({ outlineTestId, paneRailTestId }) => {
    const outline = document.querySelector<HTMLElement>(`[data-testid="${outlineTestId}"]`);
    const paneRail = document.querySelector<HTMLElement>(`[data-testid="${paneRailTestId}"]`);

    if (!outline || !paneRail) {
      throw new Error("Missing reorder outline or pane rail.");
    }

    const outlineRect = outline.getBoundingClientRect();
    const paneRailRect = paneRail.getBoundingClientRect();

    return {
      left: outlineRect.left - paneRailRect.left,
      width: outlineRect.width,
    };
  }, {
    outlineTestId: redesignedShellTestIds.paneReorderOutline,
    paneRailTestId: "pane-rail",
  });
}

async function paneViewportRect(page: Parameters<typeof getRedesignedShell>[0], title: string): Promise<{
  left: number;
  width: number;
}> {
  return page.evaluate(({ paneTitle, paneTestId }) => {
    const pane = Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${paneTestId}"]`)).find(
      (entry) => entry.getAttribute("aria-label") === `Log pane ${paneTitle}`,
    );

    if (!pane) {
      throw new Error(`Missing pane ${paneTitle}.`);
    }

    const rect = pane.getBoundingClientRect();
    return { left: rect.left, width: rect.width };
  }, { paneTitle: title, paneTestId: redesignedShellTestIds.logPane });
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
