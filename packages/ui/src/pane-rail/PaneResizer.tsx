import React from "react";

export interface PaneResizerProps {
  readonly leftPaneTitle: string;
  readonly onResize: (delta: number) => void;
}

export function PaneResizer({ leftPaneTitle, onResize }: PaneResizerProps) {
  return (
    <div role="separator" aria-label={`Resize boundary after ${leftPaneTitle}`}>
      <button type="button" aria-label={`Move boundary after ${leftPaneTitle} left`} onClick={() => onResize(-80)}>
        -
      </button>
      <button type="button" aria-label={`Move boundary after ${leftPaneTitle} right`} onClick={() => onResize(80)}>
        +
      </button>
    </div>
  );
}
