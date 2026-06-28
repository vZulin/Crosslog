import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { expectObsoleteControlsAbsent, getRedesignedShell } from "./helpers/redesigned-shell";

test("shows unsupported local monitoring messaging in the browser", async ({ page }) => {
  await page.goto("/");
  const shell = getRedesignedShell(page);

  await expect(shell.shell).toBeVisible();
  await expect(page.getByTestId(redesignedShellTestIds.capabilityLimitations)).toContainText(
    "Browser sessions cannot monitor local filesystem changes.",
  );
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();
  await expect(page.getByTestId(redesignedShellTestIds.capabilityLimitations)).toContainText(
    "Browser sessions cannot monitor local filesystem changes.",
  );
  await expectObsoleteControlsAbsent(page);
  await expect(page.getByRole("button", { name: "Append live line" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete active file" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replace active file" })).toHaveCount(0);

  const appPane = page.getByTestId(redesignedShellTestIds.logPane).filter({ hasText: "app.log" }).first();
  const appHeader = appPane.getByTestId(redesignedShellTestIds.paneHeader);

  await expect(appHeader.getByTestId(redesignedShellTestIds.paneHeaderMonitoringUnsupported)).toHaveText(
    "Monitoring unavailable",
  );
  await expect(appHeader.getByRole("status", { name: "File state for app.log: Monitoring unavailable" })).toBeVisible();
});
