import { expect } from "@wdio/globals";
import { openSampleLogsWithUiBridge, waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop directory navigation", () => {
  it("navigates directory files without auto-switching on refresh", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    await expect($("aria/app-2026-06-16.log")).toBeExisting();
    await expect($("aria/Previous file in logs/2026")).toBeDisabled();

    await $("aria/Next file in logs/2026").click();
    await expect($("aria/app-2026-06-15.log")).toBeExisting();

    await $("aria/Previous file in logs/2026").click();
    await $("button=Discover newer directory file").click();
    await expect($("aria/app-2026-06-16.log")).toBeExisting();

    await $("aria/Previous file in logs/2026").click();
    await expect($("aria/app-2026-06-17.log")).toBeExisting();
  });
});
