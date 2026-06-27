import React from "react";
import { AddPaneButton } from "../pane-rail/AddPaneButton";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { CrosslogIcon } from "./icons";
import { redesignedShellTestIds } from "./testIds";

export interface TopbarProps {
  readonly syncEnabled: boolean;
  readonly canSplitPane: boolean;
  readonly onSyncEnabledChange: (enabled: boolean) => void;
  readonly onAddPane: () => void;
  readonly onSplitPane: () => void;
}

export function Topbar({
  canSplitPane,
  syncEnabled,
  onAddPane,
  onSplitPane,
  onSyncEnabledChange,
}: TopbarProps) {
  return (
    <div className="crosslog-topbar">
      <label className="crosslog-command-field">
        <CrosslogIcon name="command-search" />
        <span className="crosslog-sr-only">Command or workspace search</span>
        <input
          aria-label="Command or workspace search"
          className="crosslog-command-field__input"
          data-testid={redesignedShellTestIds.commandField}
          id={redesignedShellTestIds.commandField}
          placeholder="Command or workspace search"
          type="search"
        />
      </label>
      <div className="crosslog-topbar__actions">
        <div className="crosslog-topbar__sync" data-testid={redesignedShellTestIds.topbarSync}>
          <SynchronizationToggle enabled={syncEnabled} onEnabledChange={onSyncEnabledChange} />
        </div>
        <AddPaneButton
          addPaneTestId={redesignedShellTestIds.topbarAddPane}
          canSplit={canSplitPane}
          onAddPane={onAddPane}
          onSplitPane={onSplitPane}
        />
      </div>
    </div>
  );
}
