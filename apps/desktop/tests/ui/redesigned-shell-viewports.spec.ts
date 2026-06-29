import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

const windowScenarios = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "constrained", width: 760, height: 720 },
] as const;

describe("Desktop redesigned shell viewport coverage", () => {
  it("keeps primary shell controls visible and distinct at supported window sizes", async () => {
    await waitForDesktopShell();
    const expectedPlatform = expectedDefaultPlatformVariant();

    await waitForUiTestTitleFragment(`platform=${expectedPlatform}`);
    await expect(browser.$(byTestId(redesignedShellTestIds.platformChrome))).toBeExisting();
    const defaultPlatformChromeSelector = platformChromeSelector(expectedPlatform);
    if (defaultPlatformChromeSelector) {
      await expect(browser.$(defaultPlatformChromeSelector)).toBeExisting();
    }

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
      await expectPaneHeaderIdentityBandsStayAboveActions();
    }
  });
});

function expectedDefaultPlatformVariant(): "macos" | "windows" | "linux" {
  if (process.platform === "win32") {
    return "windows";
  }

  if (process.platform === "linux") {
    return "linux";
  }

  return "macos";
}

function platformChromeSelector(platform: "macos" | "windows" | "linux"): string | null {
  switch (platform) {
    case "macos":
      return null;
    case "windows":
      return byTestId(redesignedShellTestIds.platformChromeWindowsCaptionControls);
    case "linux":
      return byTestId(redesignedShellTestIds.platformChromeLinuxCaptionControls);
  }
}

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

async function expectPaneHeaderIdentityBandsStayAboveActions(): Promise<void> {
  const violations = await browser.execute(() => {
    const maxAllowedOverlapArea = 1;

    const intersectionArea = (left: DOMRect, right: DOMRect) => {
      const overlapWidth = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
      const overlapHeight = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
      return overlapWidth * overlapHeight;
    };

    return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).flatMap(
      (pane, paneIndex) => {
        const header = pane.querySelector<HTMLElement>('[data-testid="pane-header"]');
        const actions = pane.querySelector<HTMLElement>(".crosslog-pane-header__actions");

        if (!header || !actions) {
          return [`pane ${paneIndex}: missing header or actions`];
        }

        const headerRect = header.getBoundingClientRect();
        const actionsRect = actions.getBoundingClientRect();
        const identityBands = Array.from(
          header.querySelectorAll<HTMLElement>(".crosslog-pane-header__title-row, .crosslog-empty-directory-status"),
        );

        return identityBands.flatMap((identityBand, bandIndex) => {
          const bandRect = identityBand.getBoundingClientRect();
          const bandName = identityBand.className || `identity band ${bandIndex}`;
          const errors: string[] = [];

          if (bandRect.top < headerRect.top - 1 || bandRect.bottom > headerRect.bottom + 1) {
            errors.push(`pane ${paneIndex}: ${bandName} escapes pane header`);
          }

          if (intersectionArea(bandRect, actionsRect) > maxAllowedOverlapArea) {
            errors.push(`pane ${paneIndex}: ${bandName} overlaps pane header actions`);
          }

          return errors;
        });
      },
    );
  }) as string[];

  expect(violations).toEqual([]);
}

function intersectionArea(left: ElementRect, right: ElementRect): number {
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));

  return width * height;
}
