import { expect } from "@wdio/globals";
import {
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

    const syncToggle = await $('[aria-label="Synchronize by time"]');
    await expect(syncToggle).toBeExisting();

    const panes = await $$('[data-testid="log-pane"]');
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="3"]'));
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("true");

    enqueueDesktopUiTestAction("toggleSynchronization");
    await waitForUiTestTitleFragment("sync=off");
    await clickElementWithJavaScript(await panes[0].$('[data-line-number="4"]'));
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("false");
  });
});
