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
  private nativeTitleUpdateQueue: Promise<void> | null = null;
  private pendingNativeTitleState: string | null = null;

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
    await this.publishNativeTitle(formattedState);
  }

  async publishPaneNavigation(paneNavigation: UiTestPaneNavigationEvidence): Promise<void> {
    if (!(await this.isEnabled()) || !this.publishedState) {
      return;
    }

    const nextState = updateUiTestPaneNavigation(this.publishedState, paneNavigation);

    this.publishedState = nextState;
    document.title = `Crosslog UI Test | ${nextState}`;
    await this.publishNativeTitle(nextState);
  }

  async publishSynchronizationTargetLine(lineNumber: number | null): Promise<void> {
    if (!(await this.isEnabled()) || !this.publishedState) {
      return;
    }

    const nextState = updateUiTestSynchronizationTargetLine(this.publishedState, lineNumber);

    this.publishedState = nextState;
    document.title = `Crosslog UI Test | ${nextState}`;
    await this.publishNativeTitle(nextState);
  }

  private publishNativeTitle(state: string): Promise<void> {
    // React effects can publish several snapshots before Tauri finishes a
    // native title update. Serialize updates and coalesce intermediate states
    // so an older snapshot cannot overwrite a newer state or create a backlog
    // that delays reset detection on Desktop UI test runners.
    this.pendingNativeTitleState = state;

    if (this.nativeTitleUpdateQueue === null) {
      this.nativeTitleUpdateQueue = this.drainNativeTitleUpdates();
    }

    return this.nativeTitleUpdateQueue;
  }

  private async drainNativeTitleUpdates(): Promise<void> {
    try {
      while (this.pendingNativeTitleState !== null) {
        const nextState = this.pendingNativeTitleState;
        this.pendingNativeTitleState = null;

        try {
          await invoke("publish_ui_test_state", { state: nextState });
        } catch {
          // A failed diagnostic title update must not block later snapshots.
        }
      }
    } finally {
      this.nativeTitleUpdateQueue = null;

      if (this.pendingNativeTitleState !== null) {
        this.nativeTitleUpdateQueue = this.drainNativeTitleUpdates();
      }
    }
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
