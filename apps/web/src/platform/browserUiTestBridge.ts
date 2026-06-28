import {
  formatUiTestShellState,
  isUiTestAction,
  type UiTestAction,
  type UiTestBridge,
  type UiTestShellState,
} from "@crosslog/platform";

declare global {
  interface Window {
    __crosslogUiTestActions?: string[];
    __crosslogUiTestShellState?: string;
  }
}

export function createBrowserUiTestBridge(): UiTestBridge | undefined {
  if (!browserUiTestModeEnabled()) {
    return undefined;
  }

  return new BrowserUiTestBridge();
}

class BrowserUiTestBridge implements UiTestBridge {
  async isEnabled(): Promise<boolean> {
    return browserUiTestModeEnabled();
  }

  async publishShellState(state: UiTestShellState): Promise<void> {
    const formattedState = formatUiTestShellState(state);

    document.title = `Crosslog UI Test | ${formattedState}`;
    window.__crosslogUiTestShellState = formattedState;
  }

  async consumePendingAction(): Promise<UiTestAction | null> {
    const actionQueue = window.__crosslogUiTestActions ?? [];

    window.__crosslogUiTestActions = actionQueue;

    while (actionQueue.length > 0) {
      const action = actionQueue.shift();

      if (isUiTestAction(action)) {
        return action;
      }
    }

    return null;
  }
}

function browserUiTestModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("crosslog-ui-test") === "1";
}
