import React from "react";

export interface StatusBarProps {
  readonly paneCount: number;
  readonly syncEnabled: boolean;
  readonly activeSourceLabel: string | null;
  readonly message?: string | null;
}

export function StatusBar({
  activeSourceLabel,
  message,
  paneCount,
  syncEnabled,
}: StatusBarProps) {
  const activeLabel = activeSourceLabel ?? "None";
  const paneCountLabel = `${paneCount} ${paneCount === 1 ? "pane" : "panes"}`;
  const syncLabel = syncEnabled ? "Sync on" : "Sync off";
  const accessibleSummary = `${paneCountLabel}, ${syncLabel}, active source ${activeLabel}`;

  return (
    <div
      aria-label={accessibleSummary}
      aria-live="polite"
      className="crosslog-status-bar"
      data-active-source={activeLabel}
      data-sync-enabled={syncEnabled ? "true" : "false"}
      role="status"
    >
      <span>{paneCountLabel}</span>
      <span>{syncLabel}</span>
      <span className="crosslog-status-bar__active-source" title={activeLabel}>
        Active: {activeLabel}
      </span>
      {message ? <span className="crosslog-status-bar__message">{message}</span> : null}
    </div>
  );
}
