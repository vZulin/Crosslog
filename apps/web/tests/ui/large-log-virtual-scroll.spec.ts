import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getRedesignedShell, gotoWithWebUiTestBridge } from "./helpers/redesigned-shell";

const largeLogFixturePath = join(process.cwd(), "tests/fixtures/logs/idea.3.log");
const expectedRenderedRowCount = 600;
// Hosted runners may pause the browser event loop without delaying text
// recovery. Keep this as a severe-stall guard while blank/recovery metrics
// remain the user-visible performance gates.
const maxAllowedProbeFrameIntervalMs = 150;

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
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(expectedRenderedRowCount);

  await moveMouseOverViewport(page, viewport);
  await startBlankFrameProbe(viewport);

  await scrollViewportToLine(viewport, 1_200, 24);

  const blankFrames = await stopBlankFrameProbe(page);

  await expect(shell.shell).toBeVisible();
  await expect(pane).toBeVisible();
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(expectedRenderedRowCount);
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

  await scrollViewportToLine(viewport, 700, 36);

  const blankFrames = await stopBlankFrameProbe(page);

  const viewportState = await readViewportState(viewport);

  expect(viewportState.rootChildCount).toBeGreaterThan(0);
  expect(viewportState.rowCount).toBe(expectedRenderedRowCount);
  expect(viewportState.visibleRowCount).toBeGreaterThan(0);
  expect(blankFrames, `Blank viewport frames: ${JSON.stringify(blankFrames.slice(0, 5))}`).toEqual([]);
  expect(Number(viewportState.selectedLineNumber)).toBeGreaterThanOrEqual(650);
  expect(Number(viewportState.selectedLineNumber)).toBeLessThanOrEqual(750);
  expect(Number(viewportState.firstLineNumber)).toBeLessThanOrEqual(Number(viewportState.selectedLineNumber));
  expect(Number(viewportState.lastLineNumber)).toBeGreaterThan(Number(viewportState.selectedLineNumber));
  expect(pageErrors).toEqual([]);
});

test("keeps text coverage current during 400 ms fast-scroll bursts", async ({ page }) => {
  const viewport = await openLargeLog(page);
  const forwardMetrics = await measureFastScrollTextCoverage(viewport, {
    durationMs: 400,
    targetLineNumber: 1_200,
  });
  const backwardMetrics = await measureFastScrollTextCoverage(viewport, {
    durationMs: 400,
    targetLineNumber: 1,
  });

  console.info(
    `Fast-scroll text coverage: ${JSON.stringify({ forward: forwardMetrics, backward: backwardMetrics })}`,
  );

  for (const metrics of [forwardMetrics, backwardMetrics]) {
    expect(metrics.blankEpisodeCount, JSON.stringify(metrics.worstSamples)).toBe(0);
    expect(metrics.maxFrameIntervalMs).toBeLessThanOrEqual(maxAllowedProbeFrameIntervalMs);
    expect(metrics.maxTextRecoveryMs).toBeLessThanOrEqual(50);
  }
});

test("keeps synchronized large panes inside the fast-scroll frame budget", async ({ page }) => {
  const viewport = await openSynchronizedLargeLogs(page);

  await moveMouseOverViewport(page, viewport);
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(expectedRenderedRowCount);

  const metrics = await measureFastScrollTextCoverage(viewport, {
    durationMs: 400,
    targetLineNumber: 1_200,
  });

  console.info(`Synchronized fast-scroll text coverage: ${JSON.stringify(metrics)}`);

  expect(metrics.blankEpisodeCount, JSON.stringify(metrics.worstSamples)).toBe(0);
  expect(metrics.maxFrameIntervalMs).toBeLessThanOrEqual(maxAllowedProbeFrameIntervalMs);
  expect(metrics.maxTextRecoveryMs).toBeLessThanOrEqual(50);
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
  await expect(viewport.locator(".crosslog-log-viewport__row")).toHaveCount(expectedRenderedRowCount);

  return viewport;
}

async function openSynchronizedLargeLogs(page: Page): Promise<Locator> {
  await gotoWithWebUiTestBridge(page);

  const shell = getRedesignedShell(page);
  const fileContents = readFileSync(largeLogFixturePath, "utf8");
  const expectedLineCount = String(fileContents.split(/\r?\n/).length);
  const dataTransfer = await page.evaluateHandle((contents) => {
    const dataTransfer = new DataTransfer();

    dataTransfer.items.add(new File([contents], "idea.3-primary.log"));
    dataTransfer.items.add(new File([contents], "idea.3-secondary.log"));
    return dataTransfer;
  }, fileContents);

  await shell.emptyDropZone.dispatchEvent("dragover", { dataTransfer });
  await shell.emptyDropZone.dispatchEvent("drop", { dataTransfer });

  const panes = page.getByTestId("log-pane");

  await expect(panes).toHaveCount(2);

  const viewport = panes.nth(0).getByTestId("log-viewport");

  await expect(viewport).toHaveAttribute("data-line-count", expectedLineCount);

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

async function scrollViewportToLine(viewport: Locator, lineNumber: number, steps: number): Promise<void> {
  await viewport.evaluate(
    async (element, options) => {
      const rows = Array.from(element.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"));
      const firstRowHeight = rows[0]?.getBoundingClientRect().height ?? 18;
      const targetScrollTop = Math.max(
        0,
        Math.min(
          element.scrollHeight - element.clientHeight,
          8 + (options.lineNumber - 1) * firstRowHeight,
        ),
      );
      const startScrollTop = element.scrollTop;
      const frameCount = Math.max(1, options.steps);

      for (let index = 1; index <= frameCount; index += 1) {
        element.scrollTop = Math.round(startScrollTop + ((targetScrollTop - startScrollTop) * index) / frameCount);
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
    },
    { lineNumber, steps },
  );
}

async function measureFastScrollTextCoverage(
  viewport: Locator,
  options: {
    readonly durationMs: number;
    readonly targetLineNumber: number;
  },
) {
  return viewport.evaluate(async (element, input) => {
    type CoverageSample = {
      readonly atMs: number;
      readonly firstRenderedLineNumber: number | null;
      readonly lastRenderedLineNumber: number | null;
      readonly missingVisibleLineCount: number;
      readonly scrollTop: number;
      readonly visibleEndLineNumber: number;
      readonly visibleStartLineNumber: number;
    };

    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const rowHeightPx = 18;
    const viewportPaddingPx = 8;
    const startTime = performance.now();
    const startScrollTop = element.scrollTop;
    const targetScrollTop = Math.max(
      0,
      Math.min(
        element.scrollHeight - element.clientHeight,
        viewportPaddingPx + (input.targetLineNumber - 1) * rowHeightPx,
      ),
    );
    const samples: CoverageSample[] = [];
    const frameIntervals: number[] = [];
    const textRecoveryDurations: number[] = [];
    let previousFrameTime = startTime;
    let blankStartedAt: number | null = null;

    const readCoverage = (): CoverageSample => {
      const rows = Array.from(element.querySelectorAll<HTMLElement>(".crosslog-log-viewport__row"));
      const firstRenderedLineNumber = Number(rows[0]?.dataset.lineNumber) || null;
      const lastRenderedLineNumber = Number(rows.at(-1)?.dataset.lineNumber) || null;
      const visibleStartLineNumber = Math.max(
        1,
        Math.floor(Math.max(0, element.scrollTop - viewportPaddingPx) / rowHeightPx) + 1,
      );
      const visibleEndLineNumber = Math.min(
        Number(element.dataset.lineCount ?? 0),
        Math.ceil((element.scrollTop + element.clientHeight - viewportPaddingPx) / rowHeightPx),
      );
      const coveredStartLineNumber = Math.max(
        visibleStartLineNumber,
        firstRenderedLineNumber ?? Number.POSITIVE_INFINITY,
      );
      const coveredEndLineNumber = Math.min(
        visibleEndLineNumber,
        lastRenderedLineNumber ?? Number.NEGATIVE_INFINITY,
      );
      const visibleLineCount = Math.max(0, visibleEndLineNumber - visibleStartLineNumber + 1);
      const coveredLineCount = Math.max(0, coveredEndLineNumber - coveredStartLineNumber + 1);

      return {
        atMs: Math.round((performance.now() - startTime) * 10) / 10,
        firstRenderedLineNumber,
        lastRenderedLineNumber,
        missingVisibleLineCount: Math.max(0, visibleLineCount - coveredLineCount),
        scrollTop: Math.round(element.scrollTop),
        visibleEndLineNumber,
        visibleStartLineNumber,
      };
    };

    const recordCoverage = (): CoverageSample => {
      const sample = readCoverage();

      samples.push(sample);

      if (sample.missingVisibleLineCount > 0 && blankStartedAt === null) {
        blankStartedAt = performance.now();
      } else if (sample.missingVisibleLineCount === 0 && blankStartedAt !== null) {
        textRecoveryDurations.push(performance.now() - blankStartedAt);
        blankStartedAt = null;
      }

      return sample;
    };

    while (true) {
      await new Promise<void>((resolve) => window.requestAnimationFrame((frameTime) => {
        frameIntervals.push(frameTime - previousFrameTime);
        previousFrameTime = frameTime;
        resolve();
      }));
      recordCoverage();

      const progress = Math.min(1, (performance.now() - startTime) / input.durationMs);

      element.scrollTop = Math.round(
        startScrollTop + (targetScrollTop - startScrollTop) * progress,
      );
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
      recordCoverage();

      if (progress >= 1) {
        break;
      }
    }

    const burstEndTime = performance.now();
    const recoveryDeadline = burstEndTime + 1_000;
    let finalCoverage = recordCoverage();

    while (finalCoverage.missingVisibleLineCount > 0 && performance.now() < recoveryDeadline) {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      finalCoverage = recordCoverage();
    }

    if (blankStartedAt !== null) {
      textRecoveryDurations.push(performance.now() - blankStartedAt);
    }

    const blankSamples = samples.filter((sample) => sample.missingVisibleLineCount > 0);
    const worstSamples = [...blankSamples]
      .sort((left, right) => right.missingVisibleLineCount - left.missingVisibleLineCount)
      .slice(0, 5);

    return {
      actualBurstDurationMs: Math.round((burstEndTime - startTime) * 10) / 10,
      blankEpisodeCount: textRecoveryDurations.length,
      blankSampleCount: blankSamples.length,
      maxFrameIntervalMs: Math.round(Math.max(0, ...frameIntervals) * 10) / 10,
      maxMissingVisibleLineCount: Math.max(
        0,
        ...blankSamples.map((sample) => sample.missingVisibleLineCount),
      ),
      maxTextRecoveryMs: Math.round(Math.max(0, ...textRecoveryDurations) * 10) / 10,
      worstSamples,
    };
  }, options);
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
