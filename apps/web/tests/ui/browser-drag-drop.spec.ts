import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

test("loads dropped browser files into panes and keeps search available", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.emptyOpenSource).toBeVisible();
  await expect(shell.emptyDropZone).toBeVisible();

  const dataTransfer = await page.evaluateHandle(() => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(["alpha dropped line\nneedle dropped line"], "dropped.log"));
    return dataTransfer;
  });

  await shell.shell.dispatchEvent("dragover", { dataTransfer });
  await shell.shell.dispatchEvent("drop", { dataTransfer });

  const droppedPane = page
    .getByTestId("log-pane")
    .filter({ has: page.getByRole("heading", { name: "dropped.log" }) });

  await expect(droppedPane.getByText("needle dropped line")).toBeVisible();
  await waitForWebUiTestTitleFragment(page, "sourceEntry=drag-drop");
  await waitForWebUiTestTitleFragment(page, "sourceKind=file");
  await droppedPane.getByRole("button", { name: "Search in dropped.log" }).click();
  const searchPopover = droppedPane.getByTestId(redesignedShellTestIds.paneSearchPopover);
  await searchPopover.getByTestId(redesignedShellTestIds.paneSearchField).fill("needle");
  await expect(searchPopover.getByTestId(redesignedShellTestIds.paneSearchMatchCount)).toHaveText("1 of 1");
});

test("loads dropped browser directories into panes from the empty workspace", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);

  const shell = getRedesignedShell(page);
  await expect(shell.emptyDropZone).toBeVisible();

  const dataTransfer = await page.evaluateHandle(() => {
    const dataTransfer = new DataTransfer();
    const file = new File(["directory line"], "current.log");

    Object.defineProperty(file, "webkitRelativePath", {
      configurable: true,
      value: "logs/current.log",
    });
    dataTransfer.items.add(file);
    return dataTransfer;
  });

  await shell.emptyDropZone.dispatchEvent("dragover", { dataTransfer });
  await shell.emptyDropZone.dispatchEvent("drop", { dataTransfer });

  const directoryHeader = page.getByTestId(redesignedShellTestIds.paneHeader).filter({ hasText: "logs" });

  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle)).toHaveText("logs");
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText("current.log");
  await waitForWebUiTestTitleFragment(page, "sourceEntry=drag-drop");
  await waitForWebUiTestTitleFragment(page, "sourceKind=directory");
});
