import React from "react";
import { AddPaneButton } from "../pane-rail/AddPaneButton";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { CrosslogIcon } from "./icons";
import { redesignedShellTestIds } from "./testIds";

export interface TopbarProps {
  readonly syncEnabled: boolean;
  readonly onSyncEnabledChange: (enabled: boolean) => void;
  readonly onAddPane: () => void;
}

export function Topbar({
  syncEnabled,
  onAddPane,
  onSyncEnabledChange,
}: TopbarProps) {
  return (
    <div className="crosslog-topbar">
      <label className="crosslog-command-field" data-unavailable="true">
        <CrosslogIcon name="command-search" />
        <span className="crosslog-sr-only">Command or workspace search</span>
        <input
          aria-disabled="true"
          aria-label="Command or workspace search"
          className="crosslog-command-field__input"
          data-testid={redesignedShellTestIds.commandField}
          disabled
          id={redesignedShellTestIds.commandField}
          placeholder="Command or workspace search"
          title="Command search is not available yet."
          type="search"
        />
      </label>
      <div className="crosslog-topbar__sync" data-testid={redesignedShellTestIds.topbarSync}>
        <SynchronizationToggle
          enabled={syncEnabled}
          onEnabledChange={onSyncEnabledChange}
        />
      </div>
      <AddPaneButton addPaneTestId={redesignedShellTestIds.topbarAddPane} onAddPane={onAddPane} />
    </div>
  );
}
