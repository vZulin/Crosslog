import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";

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
  await droppedPane.getByRole("button", { name: "Search in dropped.log" }).click();
  const searchPopover = droppedPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await searchPopover.getByTestId(redesignedShellTestIds.paneSearchField).fill("needle");
  await expect(searchPopover.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toHaveText("1 of 1");
});
