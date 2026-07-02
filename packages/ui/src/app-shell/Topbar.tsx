import React from "react";
import { AddPaneButton } from "../pane-rail/AddPaneButton";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { CrosslogIcon } from "./icons";
import { IconButton } from "./IconButton";
import { redesignedShellTestIds } from "./testIds";

export interface TopbarProps {
  readonly syncEnabled: boolean;
  readonly onSyncEnabledChange: (enabled: boolean) => void;
  readonly onAddPane: () => void;
  /**
   * When true (Web), the topbar offers explicit Add File and Add Directory
   * actions instead of the single Add Pane action, so a directory can be opened
   * into a new pane in the browser.
   */
  readonly showSourceKindOptions?: boolean;
  readonly onAddFile?: () => void;
  readonly onAddDirectory?: () => void;
}

export function Topbar({
  syncEnabled,
  onAddPane,
  onSyncEnabledChange,
  showSourceKindOptions = false,
  onAddFile,
  onAddDirectory,
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
      <div
        className="crosslog-topbar__sync"
        data-sync-state={syncEnabled ? "active" : "inactive"}
        data-testid={redesignedShellTestIds.topbarSync}
      >
        <SynchronizationToggle
          enabled={syncEnabled}
          onEnabledChange={onSyncEnabledChange}
        />
      </div>
      {showSourceKindOptions ? (
        <div className="crosslog-pane-creation">
          <IconButton
            icon="file"
            label="Add File"
            onClick={onAddFile}
            testId={redesignedShellTestIds.topbarAddFile}
          />
          <IconButton
            icon="folder"
            label="Add Directory"
            onClick={onAddDirectory}
            testId={redesignedShellTestIds.topbarAddDirectory}
          />
        </div>
      ) : (
        <AddPaneButton addPaneTestId={redesignedShellTestIds.topbarAddPane} onAddPane={onAddPane} />
      )}
    </div>
  );
}
