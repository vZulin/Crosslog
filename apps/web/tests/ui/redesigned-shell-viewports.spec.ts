import { expect, test, type Locator } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell } from "./helpers/redesigned-shell";

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

      await page.getByRole("button", { name: "Open logs" }).click();
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
