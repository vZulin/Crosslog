import type { CrosslogPlatform } from "@crosslog/platform";
import { createTauriCapabilities } from "@crosslog/platform/tauri/tauri-capabilities";

export function createDesktopPlatform(): CrosslogPlatform {
  return {
    kind: "desktop",
    capabilities: createTauriCapabilities(),
  };
}

