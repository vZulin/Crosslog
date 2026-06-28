import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

const windowScenarios = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "constrained", width: 760, height: 720 },
] as const;

describe("Desktop redesigned shell viewport coverage", () => {
  it("keeps primary shell controls visible and distinct at supported window sizes", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    for (const windowScenario of windowScenarios) {
      await browser.setWindowSize(windowScenario.width, windowScenario.height);

      await expect(browser.$(byTestId(redesignedShellTestIds.crosslogShell))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.topbar))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.activityRail))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.paneWorkspace))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.statusBar))).toBeExisting();

      await expectSelectorsDoNotOverlap([
        { name: `${windowScenario.name} command field`, selector: byTestId(redesignedShellTestIds.commandField) },
        { name: `${windowScenario.name} sync control`, selector: byTestId(redesignedShellTestIds.topbarSync) },
        { name: `${windowScenario.name} add pane`, selector: byTestId(redesignedShellTestIds.topbarAddPane) },
      ]);

      await expectSelectorsDoNotOverlap([
        { name: `${windowScenario.name} topbar`, selector: byTestId(redesignedShellTestIds.topbar) },
        { name: `${windowScenario.name} activity rail`, selector: byTestId(redesignedShellTestIds.activityRail) },
        { name: `${windowScenario.name} pane workspace`, selector: byTestId(redesignedShellTestIds.paneWorkspace) },
        { name: `${windowScenario.name} status bar`, selector: byTestId(redesignedShellTestIds.statusBar) },
      ]);

      await expectSelectorsDoNotOverlap([
        {
          name: `${windowScenario.name} pane heading`,
          selector: `${byTestId(redesignedShellTestIds.logPane)} h2`,
        },
        {
          name: `${windowScenario.name} pane offset`,
          selector: `${byTestId(redesignedShellTestIds.logPane)} ${byTestId(redesignedShellTestIds.paneHeaderOffset)}`,
        },
        {
          name: `${windowScenario.name} pane search`,
          selector: `${byTestId(redesignedShellTestIds.logPane)} ${byTestId(redesignedShellTestIds.paneHeaderSearch)}`,
        },
        {
          name: `${windowScenario.name} pane close`,
          selector: `${byTestId(redesignedShellTestIds.logPane)} ${byTestId(redesignedShellTestIds.paneHeaderClose)}`,
        },
      ]);
    }
  });
});

interface NamedSelector {
  readonly name: string;
  readonly selector: string;
}

interface ElementRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

async function expectSelectorsDoNotOverlap(selectors: readonly NamedSelector[]): Promise<void> {
  const rects = await Promise.all(
    selectors.map(async ({ name, selector }) => ({
      name,
      rect: await getElementRect(selector, name),
    })),
  );

  for (let leftIndex = 0; leftIndex < rects.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rects.length; rightIndex += 1) {
      const left = rects[leftIndex];
      const right = rects[rightIndex];

      if (!left || !right) {
        throw new Error("No-overlap comparison received an empty element rect.");
      }

      expect(intersectionArea(left.rect, right.rect)).toBeLessThanOrEqual(1);
    }
  }
}

async function getElementRect(selector: string, name: string): Promise<ElementRect> {
  const rect = await browser.execute((cssSelector: string) => {
    const element = document.querySelector(cssSelector);

    if (!element) {
      return null;
    }

    const bounds = element.getBoundingClientRect();

    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
      width: bounds.width,
      height: bounds.height,
    };
  }, selector) as ElementRect | null;

  if (!rect) {
    throw new Error(`Expected ${name} to exist for selector ${selector}.`);
  }

  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
  return rect;
}

function intersectionArea(left: ElementRect, right: ElementRect): number {
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));

  return width * height;
}
