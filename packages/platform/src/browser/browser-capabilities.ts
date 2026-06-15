import type { CapabilityReport } from "@crosslog/core";

export function createBrowserCapabilities(): CapabilityReport {
  return {
    canOpenFiles: true,
    canOpenDirectories: "showDirectoryPicker" in globalThis,
    canWatchFiles: false,
    canDiscoverNewDirectoryFiles: false,
    canPersistSession: true,
    limitations: [
      {
        capability: "local-monitoring",
        message: "Browser sessions cannot monitor local filesystem changes.",
      },
    ],
  };
}

