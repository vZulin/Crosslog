import React from "react";
import { IconButton } from "../app-shell/IconButton";

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
    <IconButton
      aria-describedby={describedBy}
      data-ui-test-action="toggleSynchronization"
      icon="sync"
      label="Toggle time synchronization"
      onClick={() => onEnabledChange(!enabled)}
      pressed={enabled}
      tooltip={enabled ? "Time synchronization enabled" : "Time synchronization disabled"}
    />
  );
}
