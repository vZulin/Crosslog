import React from "react";
import { AddPaneButton } from "../pane-rail/AddPaneButton";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { CrosslogIcon } from "./icons";
import { redesignedShellTestIds } from "./testIds";

export interface TopbarProps {
  readonly syncEnabled: boolean;
  readonly onSyncEnabledChange: (enabled: boolean) => void;
  readonly onAddPane: () => void;
  readonly onCommandSearch?: () => void;
}

export function Topbar({
  syncEnabled,
  onAddPane,
  onCommandSearch,
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
          onFocus={onCommandSearch}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommandSearch?.();
            }
          }}
          placeholder="Command or workspace search"
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
