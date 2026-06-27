import { expect } from "@wdio/globals";
import { openSampleLogsWithUiBridge, waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop live file updates", () => {
  it("appends, retains deleted content, and treats replacement as pane-local", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPane = (await $$('[data-testid="log-pane"]'))[0];
    await appPane.click();
    await $("button=Append live line").click();
    await expect(await appPane.$("code*=live appended line")).toBeExisting();

    await $("button=Delete active file").click();
    await expect(await appPane.$('[role="status"]')).toHaveText(
      expect.stringContaining("app.log was deleted. Loaded content is retained."),
    );

    await appPane.$('[aria-label="Search app.log"]').setValue("live appended line");
    await expect(await appPane.$("span=1 of 1")).toBeExisting();

    await $("button=Replace active file").click();
    await expect(await appPane.$("code*=replacement file started")).toBeExisting();
    await expect(await appPane.$$("span=1 of 1")).toHaveLength(0);
  });
});
