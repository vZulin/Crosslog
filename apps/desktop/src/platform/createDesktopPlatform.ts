import type { CrosslogPlatform } from "@crosslog/platform";
import { createTauriCapabilities } from "@crosslog/platform/tauri/tauri-capabilities";
import { TauriDirectoryAccess } from "@crosslog/platform/tauri/tauri-directory-access";
import { TauriDragDropSource } from "@crosslog/platform/tauri/tauri-drag-drop-source";
import { TauriFileAccess } from "@crosslog/platform/tauri/tauri-file-access";
import { TauriSessionStore } from "@crosslog/platform/tauri/tauri-session-store";
import { TauriUiTestBridge } from "@crosslog/platform/tauri/tauri-ui-test-bridge";

export function createDesktopPlatform(): CrosslogPlatform {
  return {
    kind: "desktop",
    capabilities: createTauriCapabilities(),
    fileAccess: new TauriFileAccess(),
    directoryAccess: new TauriDirectoryAccess(),
    dragDropSource: new TauriDragDropSource(),
    sessionStore: new TauriSessionStore(),
    uiTestBridge: new TauriUiTestBridge(),
  };
}
