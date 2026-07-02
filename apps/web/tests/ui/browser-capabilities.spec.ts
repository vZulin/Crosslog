import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("hides browser local-monitoring warnings without exposing live-file controls", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(page.getByText("Browser sessions cannot monitor local filesystem changes.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Append live line" })).toHaveCount(0);
});

test("offers directory opening alongside file opening on the Web (bug 4)", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();

  // Empty workspace exposes both an Open File and an Open Directory action.
  await expect(page.getByTestId(redesignedShellTestIds.emptyOpenFile)).toBeVisible();
  await expect(page.getByTestId(redesignedShellTestIds.emptyOpenDirectory)).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Directory" })).toBeEnabled();

  // The topbar mirrors the file/directory choice for adding further panes.
  await expect(page.getByTestId(redesignedShellTestIds.topbarAddFile)).toBeVisible();
  await expect(page.getByTestId(redesignedShellTestIds.topbarAddDirectory)).toBeVisible();

  // No directory-picker capability limitation is surfaced in a directory-capable browser.
  await expect(page.getByText("This browser cannot open local directories from the picker.")).toHaveCount(0);
});
