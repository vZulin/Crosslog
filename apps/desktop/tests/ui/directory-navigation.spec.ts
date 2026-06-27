import { expect } from "@wdio/globals";
import {
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop directory navigation", () => {
  it("navigates directory files without auto-switching on refresh", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    await expect($("aria/app-2026-06-16.log")).toBeExisting();
    await expect($("aria/Previous file in logs/2026")).toBeDisabled();

    await clickElementWithJavaScript(await $("aria/Next file in logs/2026"));
    await expect($("aria/app-2026-06-15.log")).toBeExisting();

    await clickElementWithJavaScript(await $("aria/Previous file in logs/2026"));
    await clickElementWithJavaScript(await $("button=Discover newer directory file"));
    await expect($("aria/app-2026-06-16.log")).toBeExisting();

    await clickElementWithJavaScript(await $("aria/Previous file in logs/2026"));
    await expect($("aria/app-2026-06-17.log")).toBeExisting();
  });
});
