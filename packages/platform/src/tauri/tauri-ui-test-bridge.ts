import { invoke } from "@tauri-apps/api/core";
import type { UiTestAction, UiTestBridge, UiTestShellState } from "../ports/ui-test-bridge-port";

export class TauriUiTestBridge implements UiTestBridge {
  private enabled: Promise<boolean> | null = null;

  isEnabled(): Promise<boolean> {
    this.enabled ??= invoke<boolean>("is_ui_test_mode").catch(() => false);
    return this.enabled;
  }

  async publishShellState(state: UiTestShellState): Promise<void> {
    if (!(await this.isEnabled())) {
      return;
    }

    await invoke("publish_ui_test_state", { state: formatUiTestShellState(state) });
  }

  async consumePendingAction(): Promise<UiTestAction | null> {
    if (!(await this.isEnabled())) {
      return null;
    }

    return parseUiTestAction(await invoke<string | null>("consume_ui_test_action"));
  }
}

export function formatUiTestShellState(state: UiTestShellState): string {
  return [
    `state=${state.status}`,
    `panes=${state.paneCount}`,
    `sync=${state.synchronizationEnabled ? "on" : "off"}`,
    `copied=${state.copiedPaneTitle ?? "none"}`,
    `active=${state.activePaneTitle ?? "none"}`,
    `files=${state.paneTitles.length > 0 ? state.paneTitles.join(",") : "none"}`,
  ].join(";");
}

function parseUiTestAction(action: string | null): UiTestAction | null {
  switch (action) {
    case "openSampleLogs":
    case "copyFirstPane":
    case "toggleSynchronization":
      return action;
    default:
      return null;
  }
}
