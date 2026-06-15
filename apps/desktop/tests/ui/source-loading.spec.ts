import { browser, expect } from "@wdio/globals";

describe("Desktop source loading", () => {
  it("keeps the shell available for picker and drag/drop bindings", async () => {
    await browser.url("/");
    await expect($("main")).toBeExisting();
  });
});

