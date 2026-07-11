import { expect, test, type Locator } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  shellPresentationUrl,
} from "./helpers/redesigned-shell";

const viewportScenarios = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "narrow", width: 640, height: 720 },
] as const;

test.describe("redesigned shell viewport coverage", () => {
  for (const viewport of viewportScenarios) {
    test(`keeps primary controls visible and distinct at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoWithWebUiTestBridge(page);

      const shell = getRedesignedShell(page);
      await expect(shell.shell).toBeVisible();
      await expect(shell.topbar).toBeVisible();
      await expect(shell.activityRail).toBeVisible();
      await expect(shell.paneWorkspace).toBeVisible();
      await expect(shell.statusBar).toBeVisible();
      await expect(shell.topbarSync).toHaveAttribute("data-sync-state", "active");
      await expect(shell.topbarSync.getByRole("button", { name: "Toggle time synchronization" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      await page.getByRole("button", { name: "Settings" }).click();
      await expect(shell.settingsSurface).toBeVisible();
      await expect(shell.settingsThemeSystem).toBeChecked();

      await openSampleLogsWithWebUiBridge(page);
      await expect(shell.logPanes).toHaveCount(3);
      await expect.poll(async () => {
        return shell.paneWorkspace.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
      }).toBe(true);
      await expect(shell.statusBar).toContainText("3 panes");
      await expect(shell.statusBar).toContainText("Sync on");

      await expectPairwiseNoOverlap([
        { name: "command field", locator: shell.commandField },
        { name: "sync control", locator: page.getByTestId(redesignedShellTestIds.topbarSync) },
        { name: "add file", locator: page.getByTestId(redesignedShellTestIds.topbarAddFile) },
        { name: "add directory", locator: page.getByTestId(redesignedShellTestIds.topbarAddDirectory) },
      ]);

      await expectPairwiseNoOverlap([
        { name: "topbar", locator: shell.topbar },
        { name: "activity rail", locator: shell.activityRail },
        { name: "pane workspace", locator: shell.paneWorkspace },
        { name: "status bar", locator: shell.statusBar },
      ]);

      await expectPairwiseNoOverlap([
        { name: "settings", locator: shell.settingsSurface },
        { name: "topbar", locator: shell.topbar },
        { name: "activity rail", locator: shell.activityRail },
        { name: "status bar", locator: shell.statusBar },
      ]);
      await page.getByRole("button", { name: "Close Settings" }).click();
      await expect(shell.settingsSurface).toBeHidden();

      const firstPane = shell.logPanes.first();
      await expectPairwiseNoOverlap([
        { name: "pane title", locator: firstPane.getByRole("heading").first() },
        { name: "offset", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderOffset) },
        { name: "search", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderSearch) },
        { name: "close", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderClose) },
      ]);
      await expectPaneHeaderIdentityBandsStayAboveActions(shell.logPanes);

      await firstPane.getByTestId(redesignedShellTestIds.paneHeaderSearch).click();
      await expect(shell.paneSearchPopover).toBeVisible();
      await expectIconsCenteredWithinHoverZones([
        { name: "sync toggle", locator: shell.topbarSync.getByRole("button", { name: "Toggle time synchronization" }) },
        { name: "add file", locator: shell.topbarAddFile },
        { name: "add directory", locator: shell.topbarAddDirectory },
        { name: "activity rail search", locator: shell.activityRail.getByRole("button", { name: "Search logs" }) },
        { name: "activity rail sources", locator: shell.activityRail.getByRole("button", { name: "Open sources" }) },
        { name: "activity rail settings", locator: shell.activityRail.getByRole("button", { name: "Settings" }) },
        { name: "pane close", locator: firstPane.getByTestId(redesignedShellTestIds.paneHeaderClose) },
        { name: "search previous", locator: shell.paneSearchPopover.getByTestId(redesignedShellTestIds.paneSearchPrevious) },
        { name: "search next", locator: shell.paneSearchPopover.getByTestId(redesignedShellTestIds.paneSearchNext) },
      ]);
    });
  }

  for (const theme of ["light", "dark"] as const) {
    test(`applies ${theme} theme tokens to actual Web shell surfaces`, async ({ page }) => {
      await page.goto(shellPresentationUrl("/", { theme, platform: "web", uiTestBridge: true }));

      const shell = getRedesignedShell(page);
      await expect(shell.shell).toHaveAttribute("data-theme", theme);
      await expect(shell.themeVariant).toHaveText(theme);
      await openSampleLogsWithWebUiBridge(page);
      await expect(shell.logPanes).toHaveCount(3);

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
          commandField: read(".crosslog-command-field"),
          syncButton: read('[data-ui-test-action="toggleSynchronization"]'),
          railSearchButton: read('[data-testid="activity-rail-search"]'),
          paneHeader: read('[data-testid="pane-header"]'),
        };
      });

      if (theme === "dark") {
        expect(colors.shell.backgroundColor).toBe("rgb(28, 28, 30)");
        expect(colors.topbar.backgroundColor).toBe("rgb(37, 38, 42)");
        expect(colors.rail.backgroundColor).toBe("rgb(31, 32, 36)");
        expect(colors.status.backgroundColor).toBe("rgb(31, 32, 36)");
        expect(colors.commandField.backgroundColor).toBe("rgb(32, 33, 36)");
        expect(colors.syncButton.backgroundColor).toBe("rgba(10, 132, 255, 0.24)");
        expect(colors.syncButton.color).toBe("rgb(10, 132, 255)");
        expect(colors.railSearchButton.backgroundColor).toBe("rgb(37, 38, 42)");
        expect(colors.railSearchButton.color).toBe("rgb(161, 161, 166)");
        expect(colors.paneHeader.backgroundColor).toBe("rgb(32, 33, 36)");
      } else {
        expect(colors.shell.backgroundColor).toBe("rgb(245, 245, 247)");
        expect(colors.topbar.backgroundColor).toBe("rgb(250, 250, 250)");
        expect(colors.rail.backgroundColor).toBe("rgb(240, 240, 243)");
        expect(colors.status.backgroundColor).toBe("rgb(240, 240, 243)");
        expect(colors.commandField.backgroundColor).toBe("rgb(255, 255, 255)");
        expect(colors.syncButton.backgroundColor).toBe("rgb(217, 235, 255)");
        expect(colors.syncButton.color).toBe("rgb(0, 122, 255)");
        expect(colors.railSearchButton.backgroundColor).toBe("rgb(250, 250, 250)");
        expect(colors.railSearchButton.color).toBe("rgb(110, 110, 115)");
        expect(colors.paneHeader.backgroundColor).toBe("rgb(255, 255, 255)");
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

async function expectIconsCenteredWithinHoverZones(locators: readonly NamedLocator[]): Promise<void> {
  for (const { name, locator } of locators) {
    const controlBox = await visibleBox(locator, `${name} hover zone`);
    const iconBox = await visibleBox(locator.locator("svg").first(), `${name} icon`);
    const centerDeltaX = Math.abs(centerX(iconBox) - centerX(controlBox));
    const centerDeltaY = Math.abs(centerY(iconBox) - centerY(controlBox));

    expect(centerDeltaX, `${name} icon horizontal centering`).toBeLessThanOrEqual(1);
    expect(centerDeltaY, `${name} icon vertical centering`).toBeLessThanOrEqual(1);
  }
}

async function expectPaneHeaderIdentityBandsStayAboveActions(logPanes: Locator): Promise<void> {
  const violations = await logPanes.evaluateAll((panes) => {
    const maxAllowedOverlapArea = 1;

    const intersectionArea = (left: DOMRect, right: DOMRect) => {
      const overlapWidth = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
      const overlapHeight = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
      return overlapWidth * overlapHeight;
    };

    return panes.flatMap((pane, paneIndex) => {
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
    });
  });

  expect(violations).toEqual([]);
}

function intersectionArea(left: ElementBox, right: ElementBox): number {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));

  return width * height;
}

function centerX(box: ElementBox): number {
  return box.x + box.width / 2;
}

function centerY(box: ElementBox): number {
  return box.y + box.height / 2;
}
