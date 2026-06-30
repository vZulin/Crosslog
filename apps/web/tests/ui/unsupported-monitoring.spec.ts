import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  expectObsoleteControlsAbsent,
  getRedesignedShell,
  gotoWithWebUiTestBridge,
  openSampleLogsWithWebUiBridge,
} from "./helpers/redesigned-shell";

test("hides unsupported local monitoring messaging in the browser", async ({ page }) => {
  await gotoWithWebUiTestBridge(page);
  const shell = getRedesignedShell(page);

  await expect(shell.shell).toBeVisible();
  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toHaveCount(0);
  await openSampleLogsWithWebUiBridge(page);
  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toHaveCount(0);
  await expectObsoleteControlsAbsent(page);
  await expect(page.getByRole("button", { name: "Append live line" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete active file" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replace active file" })).toHaveCount(0);

  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({ hasText: "app.log" }).first();
  const appHeader = appPane.getByTestId(redesignedShellTestIds.paneHeader);

  await expect(appHeader.getByTestId(redesignedShellTestIds.paneHeaderMonitoringUnsupported)).toHaveCount(0);
  await expect(appHeader.getByText("Monitoring unavailable")).toHaveCount(0);
  await expect(appHeader.getByRole("status", { name: "File state for app.log: Monitoring unavailable" })).toHaveCount(0);
});
