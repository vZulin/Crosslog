import { invoke } from "@tauri-apps/api/core";
import {
  formatUiTestShellState,
  isUiTestAction,
  type UiTestAction,
  type UiTestBridge,
  type UiTestShellState,
} from "../ports/ui-test-bridge-port";

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

    const formattedState = formatUiTestShellState(state);
    document.title = `Crosslog UI Test | ${formattedState}`;
    await invoke("publish_ui_test_state", { state: formattedState });
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
