import { expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import { byTestId, waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop empty directory", () => {
  it("shows empty-directory status for directories without top-level files", async () => {
    await waitForDesktopShell();
    await $("button=Open empty directory").click();

    const paneHeader = await $(byTestId(redesignedShellTestIds.paneHeader));

    await expect(paneHeader.$('[role="status"]')).toHaveText("No top-level log files in logs/2026");
    await expect(paneHeader.$$(byTestId(redesignedShellTestIds.paneHeaderDirectoryPrevious))).toBeElementsArrayOfSize(0);
    await expect(paneHeader.$$(byTestId(redesignedShellTestIds.paneHeaderDirectoryNext))).toBeElementsArrayOfSize(0);
  });
});
