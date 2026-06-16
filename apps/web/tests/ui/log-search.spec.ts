import { expect, test } from "@playwright/test";

test("searches full pane content and isolates pane search state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();

  const appPane = page.getByTestId("log-pane").filter({ has: page.getByRole("heading", { name: "app.log" }) });
  const servicePane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "service.log" }) });

  await appPane.getByLabel("Search app.log").fill("line 180 token=outside-viewport");
  await expect(appPane.getByText("1 of 1")).toBeVisible();
  await expect(appPane.locator('[data-search-match="true"][data-line-number="181"]')).toBeVisible();
  await expect(servicePane.getByText("1 of 1")).toHaveCount(0);

  await appPane.getByLabel("Regular expression search for app.log").check();
  await appPane.getByLabel("Search app.log").fill("[broken");
  await expect(appPane.getByRole("alert")).toContainText("Invalid regular expression");
});
