import type { CrosslogPlatform } from "@crosslog/platform";
import { createBrowserCapabilities } from "@crosslog/platform/browser/browser-capabilities";
import { BrowserDirectoryAccess } from "@crosslog/platform/browser/browser-directory-access";
import { BrowserSessionStore } from "@crosslog/platform/browser/browser-session-store";
import { createBrowserDragDropSource } from "./browserDropSources";
import { createBrowserFileAccess } from "./browserFileSources";

export function createWebPlatform(): CrosslogPlatform {
  return {
    kind: "web",
    capabilities: createBrowserCapabilities(),
    fileAccess: createBrowserFileAccess(),
    directoryAccess: new BrowserDirectoryAccess(),
    dragDropSource: createBrowserDragDropSource(),
    sessionStore: new BrowserSessionStore(),
  };
}
