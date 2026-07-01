import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  setDesktopShellPresentation,
  type ShellPlatformVariant,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

const platformScenarios: readonly ShellPlatformVariant[] = ["macos", "windows", "linux", "web"];

describe("Desktop platform shell variants", () => {
  it("renders presentation overrides without changing product regions", async () => {
    await waitForDesktopShell();

    for (const platform of platformScenarios) {
      await setDesktopShellPresentation({ theme: platform === "web" ? "dark" : "light", platform });

      await expect(browser.$(byTestId(redesignedShellTestIds.crosslogShell))).toHaveAttribute(
        "data-platform",
        platform,
      );
      await expect(browser.$(byTestId(redesignedShellTestIds.platformChrome))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.topbar))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.activityRail))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.paneWorkspace))).toBeExisting();
      await expect(browser.$(byTestId(redesignedShellTestIds.statusBar))).toBeExisting();
      await expect(browser.$$(platformSpecificSelector(platform))).toBeElementsArrayOfSize(1);
    }
  });
});

function platformSpecificSelector(platform: ShellPlatformVariant): string {
  switch (platform) {
    case "macos":
      return byTestId(redesignedShellTestIds.platformChromeMacosTrafficLights);
    case "windows":
      return byTestId(redesignedShellTestIds.platformChromeWindowsCaptionControls);
    case "linux":
      return byTestId(redesignedShellTestIds.platformChromeLinuxCaptionControls);
    case "web":
      return byTestId(redesignedShellTestIds.platformChromeWebTitle);
  }
}
