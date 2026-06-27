import React from "react";

export interface SynchronizationToggleProps {
  readonly enabled: boolean;
  readonly describedBy?: string;
  readonly onEnabledChange: (enabled: boolean) => void;
}

export function SynchronizationToggle({
  describedBy,
  enabled,
  onEnabledChange,
}: SynchronizationToggleProps) {
  return (
    <label>
      <input
        type="checkbox"
        aria-label="Synchronize by time"
        aria-describedby={describedBy}
        data-ui-test-action="toggleSynchronization"
        checked={enabled}
        onChange={(event) => onEnabledChange(event.currentTarget.checked)}
      />
      Synchronize by time
    </label>
  );
}
