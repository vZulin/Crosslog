import { expect } from "@wdio/globals";
import { waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop log text copy", () => {
  it("keeps copy command available per pane", async () => {
    await waitForDesktopShell();
    await $("button=Open logs").click();
    await $("aria/Copy selected text from app.log").click();

    await expect($("aria/Copied app.log")).toBeExisting();
  });
});
