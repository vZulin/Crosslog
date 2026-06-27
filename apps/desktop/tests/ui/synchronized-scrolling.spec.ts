import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  enqueueDesktopUiTestAction,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop synchronized scrolling", () => {
  it("synchronizes timestamped panes and supports disabling synchronization", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const topbar = await $(byTestId(redesignedShellTestIds.topbar));
    const statusBar = await $(byTestId(redesignedShellTestIds.statusBar));
    const syncToggle = await topbar.$('[aria-label="Synchronize by time"]');
    await expect(syncToggle).toBeExisting();
    await expect(await syncToggle.isSelected()).toBe(true);
    await expect(await topbar.getText()).toContain("Sync on");
    await expect(await statusBar.getText()).toContain("Active: app-2026-06-16.log");

    const panes = await $$('[data-testid="log-pane"]');
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="3"]'));
    await expect(await panes[0].$('[data-testid="pane-header"]').getAttribute("aria-current")).toBe("true");
    await expect(await statusBar.getText()).toContain("Active: app.log");
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("true");

    enqueueDesktopUiTestAction("toggleSynchronization");
    await waitForUiTestTitleFragment("sync=off");
    await browser.waitUntil(async () => (await topbar.getText()).includes("Sync off"), {
      interval: 250,
      timeout: 5_000,
      timeoutMsg: "Topbar synchronization state did not update to Sync off.",
    });
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="4"]'));
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("false");
  });
});
