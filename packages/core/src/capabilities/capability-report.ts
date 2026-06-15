export interface CapabilityLimitation {
  readonly capability: string;
  readonly message: string;
}

export interface CapabilityReport {
  readonly canOpenFiles: boolean;
  readonly canOpenDirectories: boolean;
  readonly canWatchFiles: boolean;
  readonly canDiscoverNewDirectoryFiles: boolean;
  readonly canPersistSession: boolean;
  readonly limitations: readonly CapabilityLimitation[];
}

