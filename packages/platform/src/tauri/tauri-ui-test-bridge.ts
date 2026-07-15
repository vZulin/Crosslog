import { invoke } from "@tauri-apps/api/core";
import {
  formatUiTestShellState,
  isUiTestAction,
  updateUiTestPaneNavigation,
  updateUiTestSynchronizationTargetLine,
  type UiTestAction,
  type UiTestBridge,
  type UiTestPaneNavigationEvidence,
  type UiTestShellState,
} from "../ports/ui-test-bridge-port";

export class TauriUiTestBridge implements UiTestBridge {
  private enabled: Promise<boolean> | null = null;
  private publishedState: string | null = null;

  isEnabled(): Promise<boolean> {
    this.enabled ??= invoke<boolean>("is_ui_test_mode").catch(() => false);
    return this.enabled;
  }

  async publishShellState(state: UiTestShellState): Promise<void> {
    if (!(await this.isEnabled())) {
      return;
    }

    const formattedState = formatUiTestShellState(state);
    this.publishedState = formattedState;
    document.title = `Crosslog UI Test | ${formattedState}`;
    await invoke("publish_ui_test_state", { state: formattedState });
  }

  async publishPaneNavigation(paneNavigation: UiTestPaneNavigationEvidence): Promise<void> {
    if (!(await this.isEnabled()) || !this.publishedState) {
      return;
    }

    const nextState = updateUiTestPaneNavigation(this.publishedState, paneNavigation);

    this.publishedState = nextState;
    document.title = `Crosslog UI Test | ${nextState}`;
    await invoke("publish_ui_test_state", { state: nextState });
  }

  async publishSynchronizationTargetLine(lineNumber: number | null): Promise<void> {
    if (!(await this.isEnabled()) || !this.publishedState) {
      return;
    }

    const nextState = updateUiTestSynchronizationTargetLine(this.publishedState, lineNumber);

    this.publishedState = nextState;
    document.title = `Crosslog UI Test | ${nextState}`;
    await invoke("publish_ui_test_state", { state: nextState });
  }

  async consumePendingAction(): Promise<UiTestAction | null> {
    if (!(await this.isEnabled())) {
      return null;
    }

    return parseUiTestAction(await invoke<string | null>("consume_ui_test_action"));
  }
}

function parseUiTestAction(action: string | null): UiTestAction | null {
  return isUiTestAction(action) ? action : null;
}

export { formatUiTestShellState };
