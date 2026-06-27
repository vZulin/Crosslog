import { browser, expect } from "@wdio/globals";
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

    await setPaneSearchQuery(appSearch, "line ");
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText(
      expect.stringContaining("1 of"),
    );
    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchNext)));
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText(
      expect.stringContaining("2 of"),
    );

    await setPaneSearchQuery(appSearch, "line 180 token=outside-viewport");
    await expect(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchMatchCount))).toHaveText("1 of 1");
    await expect(await appPane.$('[data-search-match="true"][data-line-number="181"]')).toBeExisting();
    await expect(await servicePane.$$(byTestId(redesignedShellTestIds.paneSearchPopover))).toHaveLength(0);

    await clickElementWithJavaScript(await appSearch.$(byTestId(redesignedShellTestIds.paneSearchRegex)));
    await setPaneSearchQuery(appSearch, "[broken");
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

async function setPaneSearchQuery(searchPopover: WebdriverIO.Element, query: string): Promise<void> {
  const searchField = await searchPopover.$(byTestId(redesignedShellTestIds.paneSearchField));

  await searchField.waitForExist();
  await browser.execute(
    (target: HTMLInputElement, nextQuery: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

      valueSetter?.call(target, nextQuery);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    },
    searchField,
    query,
  );
  await expect(searchField).toHaveValue(query);
}
