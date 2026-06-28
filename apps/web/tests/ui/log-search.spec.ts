import { expect, test } from "@playwright/test";
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

  await appPane.getByRole("button", { name: "Search in app.log" }).click();
  const appSearch = appPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await expect(appSearch).toBeVisible();

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

  await servicePane.click();
  await activityRail.getByTestId(redesignedShellTestIds.activityRailSearch).click();
  await expect(servicePane.getByRole("dialog", { name: "Pane search for service.log" })).toBeVisible();
  await expect(appPane.getByTestId(redesignedShellTestIds.paneSearchPopover)).toHaveCount(0);

  await appPane.click();
  await commandField.focus();
  await expect(appPane.getByRole("dialog", { name: "Pane search for app.log" })).toBeVisible();
});
