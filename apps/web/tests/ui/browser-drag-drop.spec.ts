import { expect, test } from "@playwright/test";

test("loads dropped browser files into panes and keeps search available", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Empty workspace").dispatchEvent("drop", {
    dataTransfer: await page.evaluateHandle(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(["alpha dropped line\nneedle dropped line"], "dropped.log"));
      return dataTransfer;
    }),
  });

  const droppedPane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "dropped.log" }) });

  await expect(droppedPane.getByText("needle dropped line")).toBeVisible();
  await droppedPane.getByLabel("Search dropped.log").fill("needle");
  await expect(droppedPane.getByText("1 of 1")).toBeVisible();
});
