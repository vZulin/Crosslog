import { expect } from "@wdio/globals";
import {
  clickElementWithJavaScript,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
} from "./helpers/redesigned-shell";

describe("Desktop multi-pane layout", () => {
  it("opens and manages multiple log panes", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    await expect($('[data-testid="pane-rail"]')).toBeExisting();
    await expect($('aria/app.log')).toBeExisting();
    await expect($('aria/service.log')).toBeExisting();
    await clickElementWithJavaScript(await $("aria/Split active pane"));
    await expect($$('[data-testid="log-pane"]')).toBeElementsArrayOfSize(4);
  });
});
