import { expect, test, type Locator } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell, shellPresentationUrl } from "./helpers/redesigned-shell";

const viewportScenarios = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "narrow", width: 640, height: 720 },
] as const;

test.describe("redesigned shell viewport coverage", () => {
  for (const viewport of viewportScenarios) {
    test(`keeps primary controls visible and distinct at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      const shell = getRedesignedShell(page);
      await expect(shell.shell).toBeVisible();
      await expect(shell.topbar).toBeVisible();
      await expect(shell.activityRail).toBeVisible();
      await expect(shell.paneWorkspace).toBeVisible();
      await expect(shell.statusBar).toBeVisible();

      await shell.emptyOpenSource.click();
      await expect(shell.logPanes).toHaveCount(3);
      await expect(shell.workspaceScrollbar).toBeVisible();
      await expect(shell.statusBar).toContainText("3 panes");
      await expect(shell.statusBar).toContainText("Sync on");

      await expectPairwiseNoOverlap([
        { name: "command field", locator: shell.commandField },
        { name: "sync control", locator: page.getByTestId(redesignedShellTestIds.topbarSync) },
        { name: "add pane", locator: page.getByTestId(redesignedShellTestIds.topbarAddPane) },
      ]);

      await expectPairwiseNoOverlap([
        { name: "topbar", locator: shell.topbar },
        { name: "activity rail", locator: shell.activityRail },
        { name: "pane workspace", locator: shell.paneWorkspace },
        { name: "status bar", locator: shell.statusBar },
      ]);

      const firstPane = shell.logPanes.first();
      await expectPairwiseNoOverlap([
        { name: "pane title", locator: firstPane.getByRole("heading").first() },
        { name: "offset", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderOffset) },
        { name: "search", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderSearch) },
        { name: "close", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderClose) },
      ]);
    });
  }

  for (const theme of ["light", "dark"] as const) {
    test(`applies ${theme} theme tokens to actual Web shell surfaces`, async ({ page }) => {
      await page.goto(shellPresentationUrl("/", { theme, platform: "web" }));

      const shell = getRedesignedShell(page);
      await expect(shell.shell).toHaveAttribute("data-theme", theme);
      await expect(shell.themeVariant).toHaveText(theme);

      const colors = await page.evaluate(() => {
        const read = (selector: string) => {
          const element = document.querySelector(selector);

          if (!element) {
            throw new Error(`Missing selector: ${selector}`);
          }

          const style = getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
          };
        };

        return {
          shell: read('[data-testid="crosslog-shell"]'),
          topbar: read('[data-testid="topbar"]'),
          rail: read('[data-testid="activity-rail"]'),
          status: read('[data-testid="status-bar"]'),
        };
      });

      if (theme === "dark") {
        expect(colors.shell.backgroundColor).toBe("rgb(28, 28, 30)");
        expect(colors.topbar.backgroundColor).toBe("rgb(37, 38, 42)");
        expect(colors.rail.backgroundColor).toBe("rgb(31, 32, 36)");
        expect(colors.status.backgroundColor).toBe("rgb(31, 32, 36)");
      } else {
        expect(colors.shell.backgroundColor).toBe("rgb(245, 245, 247)");
        expect(colors.topbar.backgroundColor).toBe("rgb(250, 250, 250)");
        expect(colors.rail.backgroundColor).toBe("rgb(240, 240, 243)");
        expect(colors.status.backgroundColor).toBe("rgb(240, 240, 243)");
      }
    });
  }

  test("renders the Web shell without desktop radius or shadow", async ({ page }) => {
    await page.goto(shellPresentationUrl("/", { platform: "web" }));

    const shell = getRedesignedShell(page);
    await expect(shell.shell).toHaveAttribute("data-platform", "web");

    const treatment = await shell.shell.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
      };
    });

    expect(treatment.borderRadius).toBe("0px");
    expect(treatment.boxShadow).toBe("none");
  });
});

interface NamedLocator {
  readonly name: string;
  readonly locator: Locator;
}

interface ElementBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

async function expectPairwiseNoOverlap(locators: readonly NamedLocator[]): Promise<void> {
  const boxes = await Promise.all(
    locators.map(async ({ name, locator }) => ({
      name,
      box: await visibleBox(locator, name),
    })),
  );

  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
      const left = boxes[leftIndex];
      const right = boxes[rightIndex];

      if (!left || !right) {
        throw new Error("No-overlap comparison received an empty element box.");
      }

      const overlapArea = intersectionArea(left.box, right.box);
      expect(overlapArea, `${left.name} overlaps ${right.name}`).toBeLessThanOrEqual(1);
    }
  }
}

async function visibleBox(locator: Locator, name: string): Promise<ElementBox> {
  await expect(locator, `${name} should be visible`).toBeVisible();
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error(`Expected ${name} to have a rendered bounding box.`);
  }

  expect(box.width, `${name} width`).toBeGreaterThan(0);
  expect(box.height, `${name} height`).toBeGreaterThan(0);
  return box;
}

function intersectionArea(left: ElementBox, right: ElementBox): number {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));

  return width * height;
}
