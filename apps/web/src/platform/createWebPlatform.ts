import type { CrosslogPlatform } from "@crosslog/platform";
import { createBrowserCapabilities } from "@crosslog/platform/browser/browser-capabilities";
import { BrowserSessionStore } from "@crosslog/platform/browser/browser-session-store";

export function createWebPlatform(): CrosslogPlatform {
  return {
    kind: "web",
    capabilities: createBrowserCapabilities(),
    sessionStore: new BrowserSessionStore(),
  };
}
