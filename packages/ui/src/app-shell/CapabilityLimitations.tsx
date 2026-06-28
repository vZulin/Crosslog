import React from "react";
import type { CapabilityLimitation } from "@crosslog/core";
import { redesignedShellTestIds } from "./testIds";

export interface CapabilityLimitationsProps {
  readonly limitations: readonly CapabilityLimitation[];
}

export function CapabilityLimitations({ limitations }: CapabilityLimitationsProps) {
  if (limitations.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Capability limitations"
      className="crosslog-capability-limitations"
      data-testid={redesignedShellTestIds.capabilityLimitations}
    >
      <ul className="crosslog-capability-limitations__list">
        {limitations.map((limitation) => (
          <li className="crosslog-capability-limitations__item" key={limitation.capability}>
            {limitation.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
