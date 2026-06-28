import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";

test("navigates directory files without auto-switching on refresh", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId(redesignedShellTestIds.emptyOpenSource).click();

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
  await page.locator('[data-ui-test-action="discoverNewerDirectoryFile"]').evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  await expect(selectedFile).toHaveText("app-2026-06-16.log");
  await expect(previousFile).toBeEnabled();

  await previousFile.click();
  await expect(selectedFile).toHaveText("app-2026-06-17.log");
});
