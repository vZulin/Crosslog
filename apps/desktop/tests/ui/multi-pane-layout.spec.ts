import { browser, expect } from "@wdio/globals";

describe("Desktop multi-pane layout", () => {
  it("opens and manages multiple log panes", async () => {
    await browser.url("/");
    await $("button=Open logs").click();

    await expect($('[data-testid="pane-rail"]')).toBeExisting();
    await expect($('aria/app.log')).toBeExisting();
    await expect($('aria/service.log')).toBeExisting();
    await $("aria/Split active pane").click();
    await expect($$('[data-testid="log-pane"]')).toBeElementsArrayOfSize(4);
  });
});
