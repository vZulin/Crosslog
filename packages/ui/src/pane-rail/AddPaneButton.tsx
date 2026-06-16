import React from "react";

export interface AddPaneButtonProps {
  readonly canSplit: boolean;
  readonly onAddPane: () => void;
  readonly onSplitPane: () => void;
}

export function AddPaneButton({ canSplit, onAddPane, onSplitPane }: AddPaneButtonProps) {
  return (
    <div role="group" aria-label="Pane creation controls">
      <button type="button" aria-label="Add pane" onClick={onAddPane}>
        +
      </button>
      <button type="button" aria-label="Split active pane" onClick={onSplitPane} disabled={!canSplit}>
        ||
      </button>
    </div>
  );
}
