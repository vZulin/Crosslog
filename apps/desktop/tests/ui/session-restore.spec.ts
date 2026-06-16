import { browser, expect } from "@wdio/globals";

describe("Desktop session restore", () => {
  it("restores pane layout after restart without requiring scroll state", async () => {
    await browser.url("/");
    await $("button=Open logs").click();
    await expect($("h2=app.log")).toBeExisting();

    await browser.refresh();

    await expect($("h2=app.log")).toBeExisting();
    await expect($("h2=service.log")).toBeExisting();
    await expect($("h2=app-2026-06-16.log")).toBeExisting();
  });
});
