import { expect, test, type Locator } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";

test("searches from the pane popover and isolates pane search state", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();

  const activityRail = page.getByTestId(redesignedShellTestIds.activityRail);
  const commandField = page.getByTestId(redesignedShellTestIds.commandField);
  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });
  const directoryPane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "app-2026-06-16.log" }) });

  const appSearchTrigger = appPane.getByRole("button", { name: "Search in app.log" });
  await appSearchTrigger.click();
  const appSearch = appPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await expect(appSearch).toBeVisible();
  await expectCompactPopoverInsidePane(appPane, appSearch, 90);

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("line ");
  await expect(appSearch.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toContainText("1 of");
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchNext).click();
  await expect(appSearch.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toContainText("2 of");

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("line 180 token=outside-viewport");
  await expect(appSearch.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toHaveText("1 of 1");
  await expect(appPane.locator('[data-search-match="true"][data-line-number="181"]')).toBeVisible();
  await expect(servicePane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);

  await appSearch.getByTestId(redesignedShellTestIds.paneSearchRegex).check();
  await appSearch.getByTestId(redesignedShellTestIds.paneSearchField).fill("[broken");
  await expect(appSearch.getByRole("alert")).toContainText("Invalid regular expression");
  await page.keyboard.press("Escape");
  await expect(appSearch).toHaveCount(0);
  await expect(appSearchTrigger).toBeFocused();

  await servicePane.click();
  await activityRail.getByTestId(redesignedShellTestIds.activityRailSearch).click();
  await expect(servicePane.getByRole("dialog", { name: "Pane search for service.log" })).toBeVisible();
  await expectCompactPopoverInsidePane(
    servicePane,
    servicePane.getByTestId(redesignedShellTestIds.paneSearchPopover),
    90,
  );
  await expect(appPane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);

  await appPane.click();
  await commandField.focus();
  await expect(appPane.getByRole("dialog", { name: "Pane search for app.log" })).toBeVisible();

  await directoryPane.getByRole("button", { name: "Search in app-2026-06-16.log" }).click();
  const directorySearch = directoryPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await expect(directorySearch).toBeVisible();
  await expectCompactPopoverInsidePane(directoryPane, directorySearch, 90);
  await expect(appPane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);
});

async function expectCompactPopoverInsidePane(
  pane: Locator,
  popover: Locator,
  maxHeight: number,
): Promise<void> {
  const paneBox = await pane.boundingBox();
  const paneHeaderBox = await pane.getByTestId(redesignedShellTestIds.paneHeader).boundingBox();
  const popoverBox = await popover.boundingBox();

  expect(paneBox, "pane bounds").not.toBeNull();
  expect(paneHeaderBox, "pane header bounds").not.toBeNull();
  expect(popoverBox, "popover bounds").not.toBeNull();

  if (!paneBox || !paneHeaderBox || !popoverBox) {
    return;
  }

  expect(popoverBox.x).toBeGreaterThanOrEqual(paneBox.x - 1);
  expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(paneBox.x + paneBox.width + 1);
  expect(popoverBox.y).toBeGreaterThanOrEqual(paneHeaderBox.y + paneHeaderBox.height - 1);
  expect(popoverBox.height).toBeLessThan(maxHeight);
}
