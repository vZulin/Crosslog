import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  enqueueDesktopUiTestAction,
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
      await expect(await browser.$(byTestId(redesignedShellTestIds.topbarSync)).getAttribute("data-sync-state")).toBe(
        "active",
      );
      await expect(
        await browser.$(`${byTestId(redesignedShellTestIds.topbarSync)} button`).getAttribute("aria-pressed"),
      ).toBe("true");

      enqueueDesktopUiTestAction("openSettings");
      await waitForUiTestTitleFragment("settingsSurface=open");
      await expect(browser.$(byTestId(redesignedShellTestIds.settingsSurface))).toBeExisting();
      await expect(await browser.$(byTestId(redesignedShellTestIds.settingsThemeSystem)).isSelected()).toBe(true);

      await expectSelectorsDoNotOverlap([
        { name: `${windowScenario.name} command field`, selector: byTestId(redesignedShellTestIds.commandField) },
        { name: `${windowScenario.name} sync control`, selector: byTestId(redesignedShellTestIds.topbarSync) },
        { name: `${windowScenario.name} add file`, selector: byTestId(redesignedShellTestIds.topbarAddFile) },
        { name: `${windowScenario.name} add directory`, selector: byTestId(redesignedShellTestIds.topbarAddDirectory) },
      ]);

      await expectSelectorsDoNotOverlap([
        { name: `${windowScenario.name} topbar`, selector: byTestId(redesignedShellTestIds.topbar) },
        { name: `${windowScenario.name} activity rail`, selector: byTestId(redesignedShellTestIds.activityRail) },
        { name: `${windowScenario.name} pane workspace`, selector: byTestId(redesignedShellTestIds.paneWorkspace) },
        { name: `${windowScenario.name} status bar`, selector: byTestId(redesignedShellTestIds.statusBar) },
      ]);

      await expectSelectorsDoNotOverlap([
        { name: `${windowScenario.name} settings`, selector: byTestId(redesignedShellTestIds.settingsSurface) },
        { name: `${windowScenario.name} topbar`, selector: byTestId(redesignedShellTestIds.topbar) },
        { name: `${windowScenario.name} activity rail`, selector: byTestId(redesignedShellTestIds.activityRail) },
        { name: `${windowScenario.name} status bar`, selector: byTestId(redesignedShellTestIds.statusBar) },
      ]);
      enqueueDesktopUiTestAction("closeSettings");
      await waitForUiTestTitleFragment("settingsSurface=closed");

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

      enqueueDesktopUiTestAction("openActivePaneSearch");
      await waitForUiTestTitleFragment("search=open");
      await expectSelectorsHaveCenteredIcons([
        { name: `${windowScenario.name} sync toggle`, selector: '[data-ui-test-action="toggleSynchronization"]' },
        { name: `${windowScenario.name} add pane`, selector: byTestId(redesignedShellTestIds.topbarAddPane) },
        {
          name: `${windowScenario.name} activity rail search`,
          selector: `${byTestId(redesignedShellTestIds.activityRail)} button[aria-label="Search logs"]`,
        },
        {
          name: `${windowScenario.name} activity rail sources`,
          selector: `${byTestId(redesignedShellTestIds.activityRail)} button[aria-label="Open sources"]`,
        },
        {
          name: `${windowScenario.name} activity rail settings`,
          selector: `${byTestId(redesignedShellTestIds.activityRail)} button[aria-label="Settings"]`,
        },
        { name: `${windowScenario.name} pane close`, selector: byTestId(redesignedShellTestIds.paneHeaderClose) },
        { name: `${windowScenario.name} search previous`, selector: byTestId(redesignedShellTestIds.paneSearchPrevious) },
        { name: `${windowScenario.name} search next`, selector: byTestId(redesignedShellTestIds.paneSearchNext) },
      ]);
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

async function expectSelectorsHaveCenteredIcons(selectors: readonly NamedSelector[]): Promise<void> {
  const violations = await browser.execute((namedSelectors) => {
    const isVisible = (element: Element) => {
      const htmlElement = element as HTMLElement;
      const style = getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();

      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const center = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    return namedSelectors.flatMap(({ name, selector }) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector))
        .filter(isVisible)
        .flatMap((control, index) => {
          const icon = control.querySelector<SVGSVGElement>("svg");

          if (!icon) {
            return [`${name}[${index}] missing icon`];
          }

          const controlCenter = center(control.getBoundingClientRect());
          const iconCenter = center(icon.getBoundingClientRect());
          const deltaX = Math.abs(iconCenter.x - controlCenter.x);
          const deltaY = Math.abs(iconCenter.y - controlCenter.y);

          return deltaX <= 1 && deltaY <= 1 ? [] : [`${name}[${index}] off center (${deltaX}, ${deltaY})`];
        }),
    );
  }, selectors);

  expect(violations).toEqual([]);
}

function intersectionArea(left: ElementRect, right: ElementRect): number {
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));

  return width * height;
}
