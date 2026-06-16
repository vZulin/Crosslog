import { expect, test } from "@playwright/test";

test("opens and manages multiple log panes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();

  await expect(page.getByTestId("pane-rail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "service.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "latest.log" })).toBeVisible();

  await page.getByRole("button", { name: "Split active pane" }).click();
  await expect(page.getByTestId("log-pane")).toHaveCount(4);

  await page.getByRole("button", { name: "Move boundary after app.log right" }).click();
  await page.getByRole("button", { name: "Close pane service.log" }).click();
  await expect(page.getByTestId("log-pane")).toHaveCount(3);

  const scroller = page.getByRole("region", { name: "Horizontal log scroller for app.log" });
  await scroller.evaluate((element) => {
    element.scrollLeft = 120;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(scroller).toHaveJSProperty("scrollLeft", 120);
});
