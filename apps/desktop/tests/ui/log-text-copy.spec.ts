import { browser, expect } from "@wdio/globals";

describe("Desktop log text copy", () => {
  it("keeps copy command available per pane", async () => {
    await browser.url("/");
    await $("button=Open logs").click();
    await $("aria/Copy selected text from app.log").click();

    await expect($("aria/Copied app.log")).toBeExisting();
  });
});
