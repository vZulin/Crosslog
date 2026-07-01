import { expect, test } from "@playwright/test";
import { redesignedShellTestIds } from "@crosslog/ui";
import { getRedesignedShell, shellPresentationUrl, type ShellPlatformVariant } from "./helpers/redesigned-shell";

const platformScenarios: readonly ShellPlatformVariant[] = ["macos", "windows", "linux", "web"];

test.describe("Web platform shell variants", () => {
  for (const platform of platformScenarios) {
    test(`renders ${platform} chrome through query override`, async ({ page }) => {
      await page.goto(shellPresentationUrl("/", { platform }));

      const shell = getRedesignedShell(page);
      await expect(shell.shell).toHaveAttribute("data-platform", platform);
      await expect(shell.platformChrome).toBeVisible();
      await expect(page.getByTestId(redesignedShellTestIds.platformChromeTitle)).toContainText("Crosslog");
      await expect(shell.topbar).toBeVisible();
      await expect(shell.activityRail).toBeVisible();
      await expect(shell.paneWorkspace).toBeVisible();
      await expect(shell.statusBar).toBeVisible();

      await expect(page.getByTestId(redesignedShellTestIds.platformChromeMacosTrafficLights)).toHaveCount(
        platform === "macos" ? 1 : 0,
      );
      await expect(page.getByTestId(redesignedShellTestIds.platformChromeWindowsCaptionControls)).toHaveCount(
        platform === "windows" ? 1 : 0,
      );
      await expect(page.getByTestId(redesignedShellTestIds.platformChromeLinuxCaptionControls)).toHaveCount(
        platform === "linux" ? 1 : 0,
      );
      await expect(page.getByTestId(redesignedShellTestIds.platformChromeWebTitle)).toHaveCount(
        platform === "web" ? 1 : 0,
      );
    });
  }
});
