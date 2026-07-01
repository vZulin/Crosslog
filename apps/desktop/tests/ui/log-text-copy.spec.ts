import { browser, expect } from "@wdio/globals";
import { redesignedShellTestIds } from "@crosslog/ui";
import {
  byTestId,
  clickElementWithJavaScript,
  expectObsoleteControlsAbsent,
  openSampleLogsWithUiBridge,
  waitForDesktopShell,
  waitForUiTestTitleFragment,
} from "./helpers/redesigned-shell";

describe("Desktop log text copy", () => {
  it("keeps copy command available per pane", async () => {
    await waitForDesktopShell();
    await openSampleLogsWithUiBridge();

    const appPane = (await $$(byTestId(redesignedShellTestIds.logPane)))[0];

    await expect(await appPane.$(byTestId(redesignedShellTestIds.paneHeader))).toBeExisting();
    await expect(await appPane.$$(".crosslog-pane-tools")).toBeElementsArrayOfSize(0);
    await expect(await appPane.$$(".crosslog-log-text-selection__copy")).toBeElementsArrayOfSize(0);
    await expectObsoleteControlsAbsent();

    const textActions = await appPane.$('[aria-label="Log text actions for app.log"]');
    const firstPlacement = await openCopyMenuAt(textActions, 160, 54);

    expect(Math.abs(firstPlacement.actionLeft - firstPlacement.pointerX)).toBeLessThanOrEqual(2);
    expect(Math.abs(firstPlacement.actionTop - firstPlacement.pointerY)).toBeLessThanOrEqual(2);

    const edgePlacement = await openCopyMenuAt(textActions, 9_999, 9_999);

    expect(edgePlacement.actionRight).toBeLessThanOrEqual(edgePlacement.groupRight + 1);
    expect(edgePlacement.actionBottom).toBeLessThanOrEqual(edgePlacement.groupBottom + 1);

    await dismissCopyMenu(textActions);
    await expect(await appPane.$$('[role="menuitem"]')).toBeElementsArrayOfSize(0);

    await openCopyMenuAt(textActions, 160, 54);
    await clickElementWithJavaScript(await appPane.$('[role="menuitem"]'));
    await waitForUiTestTitleFragment("copied=app.log");
    expect(await hasVisibleCopiedFeedback(appPane)).toBe(false);
  });
});

interface CopyMenuPlacement {
  readonly pointerX: number;
  readonly pointerY: number;
  readonly groupRight: number;
  readonly groupBottom: number;
  readonly actionLeft: number;
  readonly actionTop: number;
  readonly actionRight: number;
  readonly actionBottom: number;
}

async function openCopyMenuAt(
  textActions: WebdriverIO.Element,
  offsetX: number,
  offsetY: number,
): Promise<CopyMenuPlacement> {
  await textActions.waitForExist();

  return browser.execute((target: HTMLElement, requestedOffsetX: number, requestedOffsetY: number) => {
    const groupRect = target.getBoundingClientRect();
    const pointerX = Math.min(groupRect.right - 1, groupRect.left + requestedOffsetX);
    const pointerY = Math.min(groupRect.bottom - 1, groupRect.top + requestedOffsetY);

    target.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      button: 2,
      cancelable: true,
      clientX: pointerX,
      clientY: pointerY,
    }));

    const action = target.querySelector<HTMLElement>('[role="menuitem"]');

    if (!action) {
      throw new Error("Copy action did not open.");
    }

    const actionRect = action.getBoundingClientRect();

    return {
      pointerX,
      pointerY,
      groupRight: groupRect.right,
      groupBottom: groupRect.bottom,
      actionLeft: actionRect.left,
      actionTop: actionRect.top,
      actionRight: actionRect.right,
      actionBottom: actionRect.bottom,
    };
  }, textActions, offsetX, offsetY);
}

async function dismissCopyMenu(textActions: WebdriverIO.Element): Promise<void> {
  await browser.execute((target: HTMLElement) => {
    const rect = target.getBoundingClientRect();

    target.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: rect.left + 8,
      clientY: rect.top + 8,
    }));
  }, textActions);
}

async function hasVisibleCopiedFeedback(pane: WebdriverIO.Element): Promise<boolean> {
  return browser.execute((paneElement: HTMLElement) => {
    const visibleElements = Array.from(paneElement.querySelectorAll<HTMLElement>("*")).filter((element) => {
      if (element.hidden || element.getAttribute("aria-hidden") === "true") {
        return false;
      }

      const style = globalThis.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    return visibleElements.some((element) => {
      const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      const ariaLabel = element.getAttribute("aria-label") ?? "";

      return text === "Copied" || ariaLabel.includes("Copied");
    });
  }, pane);
}
