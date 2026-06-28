import { expect, test } from "@playwright/test";
import { expectObsoleteControlsAbsent, getRedesignedShell } from "./helpers/redesigned-shell";

test("opens and manages multiple log panes", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 720 });
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.commandField).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.statusBar).toContainText("0 panes");

  await shell.emptyOpenSource.click();

  await expect(shell.paneWorkspace).toBeVisible();
  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "service.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
  await expect(shell.statusBar).toContainText("3 panes");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-16.log");
  await expectObsoleteControlsAbsent(page);
  await expect(shell.workspaceScrollbar).toBeHidden();
  await expectRightmostPaneAligned(page);

  await page.setViewportSize({ width: 960, height: 720 });
  await expect(shell.workspaceScrollbar).toBeVisible();
  await page.getByTestId("topbar-add-pane").click();
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

  const scroller = page.getByRole("region", { name: "Horizontal log scroller for app.log" });
  await scroller.evaluate((element) => {
    element.scrollLeft = 120;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(scroller).toHaveJSProperty("scrollLeft", 120);
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

async function paneWidth(page: Parameters<typeof getRedesignedShell>[0], title: string): Promise<number> {
  return page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: title }) })
    .evaluate((element) => element.getBoundingClientRect().width);
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
