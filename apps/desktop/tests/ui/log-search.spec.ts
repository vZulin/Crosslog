import { expect } from "@wdio/globals";
import { openSampleLogsWithUiBridge, waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop log search", () => {
  it("searches full pane content and isolates pane search state", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const panes = await $$('[data-testid="log-pane"]');
    const appPane = panes[0];
    const servicePane = panes[1];

    await appPane.$('[aria-label="Search app.log"]').setValue("line 180 token=outside-viewport");
    await expect(await appPane.$("span=1 of 1")).toBeExisting();
    await expect(await appPane.$('[data-search-match="true"][data-line-number="181"]')).toBeExisting();
    await expect(await servicePane.$$("span=1 of 1")).toHaveLength(0);

    await appPane.$('[aria-label="Regular expression search for app.log"]').click();
    await appPane.$('[aria-label="Search app.log"]').setValue("[broken");
    await expect(await appPane.$('[role="alert"]')).toHaveText(expect.stringContaining("Invalid regular expression"));
  });
});
