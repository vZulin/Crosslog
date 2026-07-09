import type { CrosslogPlatform } from "@crosslog/platform";
import { createTauriCapabilities } from "@crosslog/platform/tauri/tauri-capabilities";
import { TauriDirectoryAccess } from "@crosslog/platform/tauri/tauri-directory-access";
import { TauriDiagnosticLogger } from "@crosslog/platform/tauri/tauri-diagnostic-logger";
import { TauriDragDropSource } from "@crosslog/platform/tauri/tauri-drag-drop-source";
import { TauriFileAccess } from "@crosslog/platform/tauri/tauri-file-access";
import { TauriSessionStore } from "@crosslog/platform/tauri/tauri-session-store";
import { TauriSourcePicker } from "@crosslog/platform/tauri/tauri-source-picker";
import { TauriUiTestBridge } from "@crosslog/platform/tauri/tauri-ui-test-bridge";

export function createDesktopPlatform(): CrosslogPlatform {
  return {
    kind: "desktop",
    capabilities: createTauriCapabilities(),
    fileAccess: new TauriFileAccess(),
    directoryAccess: new TauriDirectoryAccess(),
    dragDropSource: new TauriDragDropSource(),
    sourcePicker: new TauriSourcePicker(),
    sessionStore: new TauriSessionStore(),
    diagnosticLogger: new TauriDiagnosticLogger(),
    uiTestBridge: new TauriUiTestBridge(),
  };
}
