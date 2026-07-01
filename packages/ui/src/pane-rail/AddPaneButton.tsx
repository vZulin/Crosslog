import React from "react";
import { IconButton } from "../app-shell/IconButton";

export interface AddPaneButtonProps {
  readonly onAddPane: () => void;
  readonly addPaneTestId?: string;
}

export function AddPaneButton({ addPaneTestId, onAddPane }: AddPaneButtonProps) {
  return (
    <div className="crosslog-pane-creation">
      <IconButton icon="add-pane" label="Add pane" onClick={onAddPane} testId={addPaneTestId} />
    </div>
  );
}
