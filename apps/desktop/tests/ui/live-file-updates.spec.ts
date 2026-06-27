import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop live file updates", () => {
  it("appends, retains deleted content, and treats replacement as pane-local", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPane = (await $$('[data-testid="log-pane"]'))[0];
    const appHeader = await appPane.$(byTestId(redesignedShellTestIds.paneHeader));
    await appPane.click();
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderLive))).toHaveText("Live");

    await $("button=Append live line").click();
    await expect(await appPane.$("code*=live appended line")).toBeExisting();
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderLive))).toHaveText("Live");

    await $("button=Delete active file").click();
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderDeleted))).toHaveText("Deleted");
    await expect(await appPane.$(byTestId(redesignedShellTestIds.paneDeletedStatus))).toHaveText(
      "app.log was deleted. Loaded content is retained.",
    );

    await clickElementWithJavaScript(await appPane.$(byTestId(redesignedShellTestIds.paneHeaderSearch)));
    const searchPopover = await appPane.$(byTestId(redesignedShellTestIds.paneSearchPopover));
    await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchField)).setValue("live appended line");
    await expect(await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("1 of 1");

    await $("button=Replace active file").click();
    await expect(await appHeader.$(byTestId(redesignedShellTestIds.paneHeaderReplaced))).toHaveText("Replaced");
    await expect(await appPane.$("code*=replacement file started")).toBeExisting();
    await expect(await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("0 of 0");
  });
});
