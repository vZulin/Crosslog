import { browser, expect } from "@wdio/globals";

describe("Desktop synchronized scrolling", () => {
  it("synchronizes timestamped panes and supports disabling synchronization", async () => {
    await browser.url("/");
    await $("button=Open logs").click();

    const syncToggle = await $('[aria-label="Synchronize by time"]');
    await expect(syncToggle).toBeExisting();

    const panes = await $$('[data-testid="log-pane"]');
    await panes[0].$('[data-line-number="3"]').click();
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("true");

    await syncToggle.click();
    await panes[0].$('[data-line-number="4"]').click();
    await expect(await panes[1].$('[data-line-number="3"]').getAttribute("data-sync-target")).toBe("false");
  });
});
