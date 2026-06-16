import type { CapabilityReport } from "@crosslog/core";

export interface BrowserCapabilityEnvironment {
  readonly canOpenDirectories?: boolean;
}

export function createBrowserCapabilities(environment: BrowserCapabilityEnvironment = {}): CapabilityReport {
  const canOpenDirectories = environment.canOpenDirectories ?? canSelectDirectories();

  return {
    canOpenFiles: true,
    canOpenDirectories,
    canWatchFiles: false,
    canDiscoverNewDirectoryFiles: false,
    canPersistSession: true,
    limitations: [
      {
        capability: "local-monitoring",
        message: "Browser sessions cannot monitor local filesystem changes.",
      },
      ...(canOpenDirectories
        ? []
        : [
            {
              capability: "directory-picker",
              message: "This browser cannot open local directories from the picker.",
            },
          ]),
    ],
  };
}

function canSelectDirectories(): boolean {
  if ("showDirectoryPicker" in globalThis) {
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  return "webkitdirectory" in document.createElement("input");
}
