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
    await waitForUiTestTitleFragment("darkThemeColors=on");
    await expectDesktopDarkThemeColorsMatchMockup();

    enqueueDesktopUiTestAction("closeSettings");
    await waitForUiTestTitleFragment("settingsSurface=closed");
  });
});

async function expectDesktopDarkThemeColorsMatchMockup(): Promise<void> {
  const colors = await browser.execute(() => {
    const readBackground = (selector: string) => {
      const element = document.querySelector(selector);

      if (!element) {
        throw new Error(`Missing selector: ${selector}`);
      }

      return getComputedStyle(element).backgroundColor;
    };

    return {
      shell: readBackground('[data-testid="crosslog-shell"]'),
      topbar: readBackground('[data-testid="topbar"]'),
      rail: readBackground('[data-testid="activity-rail"]'),
      workspace: readBackground('[data-testid="pane-workspace"]'),
      status: readBackground('[data-testid="status-bar"]'),
      commandField: readBackground(".crosslog-command-field"),
    };
  });

  expect(colors).toEqual({
    shell: "rgb(28, 28, 30)",
    topbar: "rgb(37, 38, 42)",
    rail: "rgb(31, 32, 36)",
    workspace: "rgb(32, 33, 36)",
    status: "rgb(31, 32, 36)",
    commandField: "rgb(32, 33, 36)",
  });
}
