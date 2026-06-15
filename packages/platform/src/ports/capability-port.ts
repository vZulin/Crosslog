import type { CapabilityReport } from "@crosslog/core";

export interface CapabilityPort {
  getCapabilities(): Promise<CapabilityReport>;
}

