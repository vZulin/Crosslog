import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getRedesignedShell, gotoWithWebUiTestBridge } from "./helpers/redesigned-shell";

const largeLogFixturePath = join(process.cwd(), "tests/fixtures/logs/idea.3.log");

test.use({ browserName: "webkit" });

test.setTimeout(30_000);

test("keeps the shell mounted while scrolling a large real-world log", async ({ page }) => {
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await gotoWithWebUiTestBridge(page);

  const shell = getRedesignedShell(page);
  const fileContents = readFileSync(largeLogFixturePath, "utf8");
  const expectedLineCount = String(fileContents.split(/\r?\n/).length);
  const dataTransfer = await page.evaluateHandle((contents) => {
    const dataTransfer = new DataTransfer();

    dataTransfer.items.add(new File([contents], "idea.3.log"));
    return dataTransfer;
  }, fileContents);

  await shell.emptyDropZone.dispatchEvent("dragover", { dataTransfer });
  await shell.emptyDropZone.dispatchEvent("drop", { dataTransfer });

  const pane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "idea.3.log" }) });
  const viewport = pane.getByTestId("log-viewport");

  await expect(viewport).toHaveAttribute("data-line-count", expectedLineCount);
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(400);

  await moveMouseOverViewport(page, viewport);
  await startBlankFrameProbe(viewport);

  for (let index = 0; index < 200; index += 1) {
    await page.mouse.wheel(0, 2_400);
  }

  const blankFrames = await stopBlankFrameProbe(page);

  await expect(shell.shell).toBeVisible();
  await expect(pane).toBeVisible();
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(400);
  await expect.poll(() => viewport.evaluate((element) => Math.round(element.scrollTop))).toBeGreaterThan(0);
  expect(blankFrames, `Blank viewport frames: ${JSON.stringify(blankFrames.slice(0, 5))}`).toEqual([]);

  const viewportState = await viewport.evaluate((element) => {
    const rows = Array.from(element.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"));
    const viewportRect = element.getBoundingClientRect();

    return {
      firstLineNumber: rows[0]?.dataset.lineNumber ?? null,
      lastLineNumber: rows.at(-1)?.dataset.lineNumber ?? null,
      selectedLineNumber: element.dataset.selectedLineNumber ?? null,
      visibleRowCount: rows.filter((row) => {
        const rowRect = row.getBoundingClientRect();

        return rowRect.bottom > viewportRect.top && rowRect.top < viewportRect.bottom;
      }).length,
      rootChildCount: document.getElementById("root")?.childElementCount ?? 0,
    };
  });

  expect(viewportState.rootChildCount).toBeGreaterThan(0);
  expect(viewportState.visibleRowCount).toBeGreaterThan(0);
  expect(Number(viewportState.firstLineNumber)).toBeGreaterThan(1);
  expect(Number(viewportState.lastLineNumber)).toBeGreaterThan(Number(viewportState.firstLineNumber));
  expect(Number(viewportState.selectedLineNumber)).toBeGreaterThan(1);
  expect(pageErrors).toEqual([]);
});

test("keeps rows visible during sustained fast scrolling near line 700", async ({ page }) => {
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const viewport = await openLargeLog(page);

  await moveMouseOverViewport(page, viewport);
  await startBlankFrameProbe(viewport);

  for (let index = 0; index < 70; index += 1) {
    await page.mouse.wheel(0, 180);
    await page.waitForTimeout(100);
  }

  const blankFrames = await stopBlankFrameProbe(page);

  const viewportState = await readViewportState(viewport);

  expect(viewportState.rootChildCount).toBeGreaterThan(0);
  expect(viewportState.rowCount).toBe(400);
  expect(viewportState.visibleRowCount).toBeGreaterThan(0);
  expect(blankFrames, `Blank viewport frames: ${JSON.stringify(blankFrames.slice(0, 5))}`).toEqual([]);
  expect(Number(viewportState.selectedLineNumber)).toBeGreaterThanOrEqual(650);
  expect(Number(viewportState.selectedLineNumber)).toBeLessThanOrEqual(750);
  expect(Number(viewportState.firstLineNumber)).toBeLessThanOrEqual(Number(viewportState.selectedLineNumber));
  expect(Number(viewportState.lastLineNumber)).toBeGreaterThan(Number(viewportState.selectedLineNumber));
  expect(pageErrors).toEqual([]);
});

async function openLargeLog(page: Page): Promise<Locator> {
  await gotoWithWebUiTestBridge(page);

  const shell = getRedesignedShell(page);
  const fileContents = readFileSync(largeLogFixturePath, "utf8");
  const expectedLineCount = String(fileContents.split(/\r?\n/).length);
  const dataTransfer = await page.evaluateHandle((contents) => {
    const dataTransfer = new DataTransfer();

    dataTransfer.items.add(new File([contents], "idea.3.log"));
    return dataTransfer;
  }, fileContents);

  await shell.emptyDropZone.dispatchEvent("dragover", { dataTransfer });
  await shell.emptyDropZone.dispatchEvent("drop", { dataTransfer });

  const pane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "idea.3.log" }) });
  const viewport = pane.getByTestId("log-viewport");

  await expect(viewport).toHaveAttribute("data-line-count", expectedLineCount);
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(400);

  return viewport;
}

async function readViewportState(viewport: Locator) {
  return viewport.evaluate((element) => {
    const rows = Array.from(element.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"));
    const viewportRect = element.getBoundingClientRect();

    return {
      firstLineNumber: rows[0]?.dataset.lineNumber ?? null,
      lastLineNumber: rows.at(-1)?.dataset.lineNumber ?? null,
      rowCount: rows.length,
      selectedLineNumber: element.dataset.selectedLineNumber ?? null,
      visibleRowCount: rows.filter((row) => {
        const rowRect = row.getBoundingClientRect();

        return rowRect.bottom > viewportRect.top && rowRect.top < viewportRect.bottom;
      }).length,
      rootChildCount: document.getElementById("root")?.childElementCount ?? 0,
    };
  });
}

async function moveMouseOverViewport(page: Page, viewport: Locator): Promise<void> {
  await viewport.scrollIntoViewIfNeeded();
  await viewport.focus();

  const box = await viewport.boundingBox();
  const viewportSize = page.viewportSize();

  if (!box || !viewportSize) {
    throw new Error("Missing log viewport bounding box.");
  }

  const x = Math.max(1, Math.min(viewportSize.width - 1, box.x + Math.min(box.width / 2, 120)));
  const y = Math.max(1, Math.min(viewportSize.height - 1, box.y + Math.min(box.height / 2, 24)));

  await page.mouse.move(x, y);
}

async function startBlankFrameProbe(viewport: Locator): Promise<void> {
  await viewport.evaluate((element) => {
    type BlankFrameProbeSample = {
      readonly firstLineNumber: string | null;
      readonly lastLineNumber: string | null;
      readonly rowCount: number;
      readonly scrollTop: number;
      readonly selectedLineNumber: string | null;
      readonly visibleRowCount: number;
    };

    const host = window as Window & {
      __crosslogBlankFrameProbe?: {
        stop: () => readonly BlankFrameProbeSample[];
      };
    };
    const samples: BlankFrameProbeSample[] = [];
    let stopped = false;

    const sample = () => {
      const rows = Array.from(element.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"));
      const viewportRect = element.getBoundingClientRect();
      const visibleRowCount = rows.filter((row) => {
        const rowRect = row.getBoundingClientRect();

        return rowRect.bottom > viewportRect.top && rowRect.top < viewportRect.bottom;
      }).length;

      if (rows.length === 0 || visibleRowCount === 0) {
        samples.push({
          firstLineNumber: rows[0]?.dataset.lineNumber ?? null,
          lastLineNumber: rows.at(-1)?.dataset.lineNumber ?? null,
          rowCount: rows.length,
          scrollTop: Math.round(element.scrollTop),
          selectedLineNumber: element.dataset.selectedLineNumber ?? null,
          visibleRowCount,
        });
      }

      if (!stopped) {
        window.requestAnimationFrame(sample);
      }
    };

    host.__crosslogBlankFrameProbe = {
      stop: () => {
        stopped = true;
        return samples;
      },
    };

    window.requestAnimationFrame(sample);
  });
}

async function stopBlankFrameProbe(page: Page) {
  return page.evaluate(() => {
    const host = window as Window & {
      __crosslogBlankFrameProbe?: {
        stop: () => readonly {
          readonly firstLineNumber: string | null;
          readonly lastLineNumber: string | null;
          readonly rowCount: number;
          readonly scrollTop: number;
          readonly selectedLineNumber: string | null;
          readonly visibleRowCount: number;
        }[];
      };
    };

    return host.__crosslogBlankFrameProbe?.stop() ?? [];
  });
}
