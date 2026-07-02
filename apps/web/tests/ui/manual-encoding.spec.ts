import { expect, test } from "@playwright/test";
import { getRedesignedShell } from "./helpers/redesigned-shell";

test("manual encoding UI is reserved for source loading flows", async ({ page }) => {
  await page.goto("/");

  const shell = getRedesignedShell(page);
  await expect(shell.shell).toBeVisible();
  await expect(shell.topbar).toBeVisible();
  await expect(shell.activityRail).toBeVisible();
  await expect(shell.paneWorkspace).toBeVisible();
  await expect(shell.statusBar).toContainText("0 panes");
  await expect(shell.emptyOpenFile).toBeVisible();
  const manualEncodingChooser = page.getByRole("combobox", { name: "Encoding" });
  await expect(page.locator('input[aria-label="Select log source files"]')).toHaveCount(0);
  await expect(manualEncodingChooser).toHaveCount(0);

  const chooser = page.waitForEvent("filechooser");
  await shell.emptyOpenFile.click();
  await (await chooser).setFiles({
    name: "manual-encoding-source.log",
    mimeType: "text/plain",
    buffer: Buffer.from("2026-06-16T09:00:00.000Z source loading remains available\n"),
  });

  await expect(page.getByRole("heading", { name: "manual-encoding-source.log" })).toBeVisible();
  await expect(manualEncodingChooser).toHaveCount(0);
});
