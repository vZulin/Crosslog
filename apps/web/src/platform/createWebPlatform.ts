import type { CrosslogPlatform } from "@crosslog/platform";
import { createBrowserCapabilities } from "@crosslog/platform/browser/browser-capabilities";

export function createWebPlatform(): CrosslogPlatform {
  return {
    kind: "web",
    capabilities: createBrowserCapabilities(),
  };
}

