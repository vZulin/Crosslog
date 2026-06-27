import { browser, expect } from "@wdio/globals";
import { waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop session restore", () => {
  it("restores pane layout after restart without requiring scroll state", async () => {
    await waitForDesktopShell();
    await $("button=Open logs").click();
    await expect($("h2=app.log")).toBeExisting();

    await browser.refresh();

    await expect($("h2=app.log")).toBeExisting();
    await expect($("h2=service.log")).toBeExisting();
    await expect($("h2=app-2026-06-16.log")).toBeExisting();
  });
});
