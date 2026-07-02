import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  enqueueWebUiTestAction,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

const directoryFixturePath = fileURLToPath(
  new URL("./fixtures/web-directory/sample-logs", import.meta.url),
);

test("opens a directory through the Web directory picker (bug 4)", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId(redesignedShellTestIds.emptyOpenDirectory)).toBeVisible();

  // The directory picker uses a hidden <input webkitdirectory>; Playwright drives
  // it through the file chooser, uploading the fixture directory's files.
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByTestId(redesignedShellTestIds.emptyOpenDirectory).click(),
  ]);
  await fileChooser.setFiles(directoryFixturePath);

  const directoryHeader = page
    .getByTestId(redesignedShellTestIds.paneHeader)
    .filter({ hasText: "sample-logs" });

  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle)).toHaveText(
    "sample-logs",
  );
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderSelectedFile)).toHaveText(
    "app-2026-06-16.log",
  );
  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
});

test("navigates directory files without auto-switching on refresh", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  await openSampleLogsWithWebUiBridge(page);

  await expect(page.getByTestId(redesignedShellTestIds.paneWorkspace)).toBeVisible();
  const directoryHeader = page.getByTestId(redesignedShellTestIds.paneHeader).filter({ hasText: "logs/2026" });
  const selectedFile = directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderSelectedFile);
  const previousFile = directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderDirectoryPrevious);
  const nextFile = directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderDirectoryNext);

  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderDirectoryTitle)).toHaveText("logs/2026");
  await expect(selectedFile).toHaveText("app-2026-06-16.log");
  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
  await expect(previousFile).toBeDisabled();
  await expect(directoryHeader.getByRole("button", { name: "Next file in logs/2026" })).toBeEnabled();
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderOffset)).toBeVisible();
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderSearch)).toBeVisible();
  await expect(directoryHeader.getByTestId(redesignedShellTestIds.paneHeaderClose)).toBeVisible();
  await expect(page.getByTestId(redesignedShellTestIds.paneHeader).filter({ hasText: "app.log" }).getByTestId(
    redesignedShellTestIds.paneHeaderDirectoryPrevious,
  )).toHaveCount(0);

  await nextFile.click();
  await expect(selectedFile).toHaveText("app-2026-06-15.log");

  await previousFile.click();
  await enqueueWebUiTestAction(page, "discoverNewerDirectoryFile");
  await waitForWebUiTestTitleFragment(page, "directoryPrevious=on");

  await expect(selectedFile).toHaveText("app-2026-06-16.log");
  await expect(previousFile).toBeEnabled();

  await previousFile.click();
  await expect(selectedFile).toHaveText("app-2026-06-17.log");
});
