import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { expectObsoleteControlsAbsent, getRedesignedShell } from "./helpers/redesigned-shell";

test("restores panes from last valid browser session after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();

  const shell = getRedesignedShell(page);
  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({
    has: page.getByRole("heading", { name: "app.log" }),
  });
  const directoryPane = page.getByTestId(redesignedShellTestIds.logPane).filter({ hasText: "logs/2026" });
  const directoryHeader = page.getByTestId(redesignedShellTestIds.paneHeader).filter({ hasText: "logs/2026" });

  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.statusBar).toContainText("3 panes");
  await expectObsoleteControlsAbsent(page);

  await dragResizeBoundary(page, "app.log", 80);
  await directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderDirectoryNext).click();
  await directoryPane.getByTestId(redesignedShellTestIds.paneHeaderOffset).click();
  await directoryPane.getByTestId(redesignedShellTestIds.timeOffsetMinutes).fill("1");
  await directoryPane.getByTestId(redesignedShellTestIds.timeOffsetApply).click();
  await shell.topbar.getByRole("button", { name: "Toggle time synchronization" }).click();

  await expect(directoryPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("+1m");
  await expect(shell.statusBar).toContainText("Sync off");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-15.log");
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
    "app-2026-06-15.log",
  );

  const resizedAppWidth = await appPane.evaluate((element) => element.getBoundingClientRect().width);
  expect(resizedAppWidth).toBeGreaterThan(520);

  const appScroller = page.getByRole("region", { name: "Horizontal log scroller for app.log" });
  await appScroller.evaluate((element) => {
    element.scrollLeft = 160;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(appScroller).toHaveJSProperty("scrollLeft", 160);

  await waitForRestorableSession(page);

  await writeCorruptPendingSession(page);
  await page.reload();

  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "service.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "app-2026-06-15.log" })).toBeVisible();
  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.workspaceScrollbar).toBeVisible();
  await expect(shell.statusBar).toContainText("3 panes");
  await expect(shell.statusBar).toContainText("Sync off");
  await expect(shell.statusBar).toContainText("Active: app-2026-06-15.log");
  await expectObsoleteControlsAbsent(page);

  await expect(directoryPane.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toContainText("+1m");
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
    "app-2026-06-15.log",
  );
  expect(await appPane.evaluate((element) => element.getBoundingClientRect().width)).toBe(resizedAppWidth);
  await expect(appScroller).toHaveJSProperty("scrollLeft", 0);
});

async function waitForRestorableSession(page: Page) {
  await page.waitForFunction(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("crosslog-session", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const snapshot = await new Promise<StoredSessionSnapshot | undefined>((resolve, reject) => {
      const request = database.transaction("snapshots", "readonly").objectStore("snapshots").get("last-valid");
      request.onsuccess = () => resolve(request.result as StoredSessionSnapshot | undefined);
      request.onerror = () => reject(request.error);
    });

    return Boolean(
      snapshot &&
        snapshot.synchronizationEnabled === false &&
        (snapshot.paneSizes?.["pane-app"] ?? 0) > 520 &&
        snapshot.directorySelections?.["source-directory"] === "directory-file-2026-06-15" &&
        snapshot.panes?.some(
          (pane) =>
            pane.id === "pane-directory" &&
            pane.timeOffset?.minutes === 1 &&
            pane.timeOffset?.seconds === 0,
        ) &&
        !snapshot.panes?.some((pane) => "horizontalScroll" in pane),
    );
  });
}

async function dragResizeBoundary(page: Page, title: string, deltaX: number) {
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

async function writeCorruptPendingSession(page: Page) {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("crosslog-session", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const request = database.transaction("snapshots", "readwrite").objectStore("snapshots").put(
        { schemaVersion: 1, panes: [{ horizontalScroll: 900 }] },
        "pending",
      );
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

interface StoredSessionSnapshot {
  readonly synchronizationEnabled?: boolean;
  readonly paneSizes?: Record<string, number>;
  readonly directorySelections?: Record<string, string>;
  readonly panes?: readonly {
    readonly id?: string;
    readonly timeOffset?: {
      readonly minutes?: number;
      readonly seconds?: number;
    };
  }[];
}
