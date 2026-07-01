import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  enqueueDesktopUiTestAction,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop settings and theme workflow", () => {
  it("opens Settings, switches theme, and preserves analysis state", async () => {
    await waitForDesktopShell();
    await waitForUiTestTitleFragment("themePreference=system");
    await waitForUiTestTitleFragment("settingsSurface=closed");

    enqueueDesktopUiTestAction("openSettings");
    await waitForUiTestTitleFragment("settingsSurface=open");
    await expect(browser.$(byTestId(redesignedShellTestIds.settingsSurface))).toBeExisting();
    await expect(await browser.$(byTestId(redesignedShellTestIds.settingsThemeSystem)).isSelected()).toBe(true);

    enqueueDesktopUiTestAction("setThemeLight");
    await waitForUiTestTitleFragment("themePreference=light");
    await waitForUiTestTitleFragment("theme=light");

    await openSampleLogsWithUiBridge();
    enqueueDesktopUiTestAction("openActivePaneSearch");
    await waitForUiTestTitleFragment("search=open");
    enqueueDesktopUiTestAction("toggleSynchronization");
    await waitForUiTestTitleFragment("sync=off");

    enqueueDesktopUiTestAction("setThemeDark");
    await waitForUiTestTitleFragment("themePreference=dark");
    await waitForUiTestTitleFragment("theme=dark");
    await waitForUiTestTitleFragment("panes=3");
    await waitForUiTestTitleFragment("search=open");
    await waitForUiTestTitleFragment("sync=off");
    await waitForUiTestTitleFragment("syncVisual=inactive");
    await waitForUiTestTitleFragment("syncPressed=off");

    enqueueDesktopUiTestAction("closeSettings");
    await waitForUiTestTitleFragment("settingsSurface=closed");
  });
});
