import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  enqueueWebUiTestAction,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
  waitForWebUiTestTitleFragment,
} from "./helpers/redesigned-shell";

test("opens a directory through the Web directory picker (bug 4)", async ({ page }) => {
  // Build the directory fixture at runtime: committed *.log fixtures are
  // .gitignored, and a real directory is needed to drive webkitdirectory upload.
  const fixtureRoot = mkdtempSync(join(tmpdir(), "crosslog-web-dir-"));
  const directoryFixturePath = join(fixtureRoot, "sample-logs");
  mkdirDirectoryFixture(directoryFixturePath);

  try {
    await page.goto("/");
    await expect(page.getByTestId(redesignedShellTestIds.emptyOpenDirectory)).toBeVisible();

    // The directory picker uses a hidden <input webkitdirectory>; Playwright
    // drives it through the file chooser, uploading the fixture directory.
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
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

function mkdirDirectoryFixture(directoryPath: string): void {
  mkdirSync(directoryPath, { recursive: true });

  const newestPath = join(directoryPath, "app-2026-06-16.log");
  const olderPath = join(directoryPath, "app-2026-06-15.log");

  writeFileSync(
    newestPath,
    "2026-06-16T09:00:00.000Z newest directory line\n2026-06-16T09:01:00.000Z second directory line\n",
  );
  writeFileSync(
    olderPath,
    "2026-06-15T09:00:00.000Z older directory line\n",
  );

  // Directory selection sorts by modification time (newest first), falling back
  // to the filename only when timestamps match. Files written back-to-back get
  // near-identical mtimes on coarse-resolution filesystems (Linux) but distinct,
  // write-order mtimes on macOS/Windows — which would make the *older*-named file
  // appear newest. Pin the mtimes to match the dates in the filenames so the
  // newest-dated file is deterministically selected on every platform.
  utimesSync(olderPath, new Date("2026-06-15T09:00:00.000Z"), new Date("2026-06-15T09:00:00.000Z"));
  utimesSync(newestPath, new Date("2026-06-16T09:00:00.000Z"), new Date("2026-06-16T09:00:00.000Z"));
}

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
