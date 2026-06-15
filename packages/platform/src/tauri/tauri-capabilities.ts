import type { CapabilityReport } from "@crosslog/core";

export function createTauriCapabilities(): CapabilityReport {
  return {
    canOpenFiles: true,
    canOpenDirectories: true,
    canWatchFiles: true,
    canDiscoverNewDirectoryFiles: true,
    canPersistSession: true,
    limitations: [],
  };
}

