import type { CrosslogPlatform } from "@crosslog/platform";
import { createTauriCapabilities } from "@crosslog/platform/tauri/tauri-capabilities";
import { TauriSessionStore } from "@crosslog/platform/tauri/tauri-session-store";

export function createDesktopPlatform(): CrosslogPlatform {
  return {
    kind: "desktop",
    capabilities: createTauriCapabilities(),
    sessionStore: new TauriSessionStore(),
  };
}
