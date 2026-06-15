import { browser, expect } from "@wdio/globals";

describe("Desktop manual encoding", () => {
  it("keeps the shell available for encoding workflows", async () => {
    await browser.url("/");
    await expect($("main")).toBeExisting();
  });
});

