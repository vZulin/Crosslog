import { expect } from "@wdio/globals";
import { waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop empty directory", () => {
  it("shows empty-directory status for directories without top-level files", async () => {
    await waitForDesktopShell();
    await $("button=Open empty directory").click();

    await expect($("aria/Empty directory logs/2026")).toHaveText("No top-level log files in logs/2026");
    await expect($$("aria/Previous file in logs/2026")).toBeElementsArrayOfSize(0);
    await expect($$("aria/Next file in logs/2026")).toBeElementsArrayOfSize(0);
  });
});
