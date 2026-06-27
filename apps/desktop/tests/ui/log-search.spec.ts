import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop log search", () => {
  it("searches from the pane popover and isolates pane search state", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const panes = await $$('[data-testid="log-pane"]');
    const appPane = panes[0];
    const servicePane = panes[1];

    await clickElementWithJavaScript(await appPane.$(byTestId(redesignedShellTestIds.paneHeaderSearch)));
    const appSearch = await appPane.$(byTestId(redesignedShellTestIds.paneSearchPopover));
    await expect(appSearch).toBeExisting();

    await appSearch.$(byTestId(redesignedShellTestIds.paneSearchField)).setValue("line ");
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText(
      expect.stringContaining("1 of"),
    );
    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchNext)));
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText(
      expect.stringContaining("2 of"),
    );

    await appSearch.$(byTestId(redesignedShellTestIds.paneSearchField)).setValue("line 180 token=outside-viewport");
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("1 of 1");
    await expect(await appPane.$('[data-search-match="true"][data-line-number="181"]')).toBeExisting();
    await expect(await servicePane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchRegex)));
    await appSearch.$(byTestId(redesignedShellTestIds.paneSearchField)).setValue("[broken");
    await expect(await appSearch.$('[role="alert"]')).toHaveText(expect.stringContaining("Invalid regular expression"));

    await clickElementWithJavaScript(servicePane);
    await clickElementWithJavaScript(await $(byTestId(redesignedShellTestIds.activityRailSearch)));
    await expect(await servicePane.$('[aria-label="Pane search for service.log"]')).toBeExisting();
    await expect(await appPane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await clickElementWithJavaScript(appPane);
    await clickElementWithJavaScript(await $(byTestId(redesignedShellTestIds.commandField)));
    await expect(await appPane.$('[aria-label="Pane search for app.log"]')).toBeExisting();
  });
});
