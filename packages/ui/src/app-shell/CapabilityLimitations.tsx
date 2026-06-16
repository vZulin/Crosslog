import React from "react";
import type { CapabilityLimitation } from "@crosslog/core";

export interface CapabilityLimitationsProps {
  readonly limitations: readonly CapabilityLimitation[];
}

export function CapabilityLimitations({ limitations }: CapabilityLimitationsProps) {
  if (limitations.length === 0) {
    return null;
  }

  return (
    <section aria-label="Capability limitations">
      {limitations.map((limitation) => (
        <p key={limitation.capability}>{limitation.message}</p>
      ))}
    </section>
  );
}
