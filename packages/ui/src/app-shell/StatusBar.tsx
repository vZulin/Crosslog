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

  return (
    <div aria-live="polite" className="crosslog-status-bar" role="status">
      <span>{paneCount} {paneCount === 1 ? "pane" : "panes"}</span>
      <span>{syncEnabled ? "Sync on" : "Sync off"}</span>
      <span className="crosslog-status-bar__active-source" title={activeLabel}>
        Active: {activeLabel}
      </span>
      {message ? <span className="crosslog-status-bar__message">{message}</span> : null}
    </div>
  );
}
