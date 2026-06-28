import React from "react";
import { PaneResizeBoundary } from "./PaneResizeBoundary";

export interface PaneResizerProps {
  readonly leftPaneTitle: string;
  readonly leftPaneWidth: number;
  readonly rightPaneWidth: number;
  readonly onResize: (delta: number) => void;
}

export function PaneResizer({
  leftPaneTitle,
  leftPaneWidth,
  rightPaneWidth,
  onResize,
}: PaneResizerProps) {
  return (
    <div className="crosslog-pane-resizer">
      <PaneResizeBoundary
        leftPaneTitle={leftPaneTitle}
        leftPaneWidth={leftPaneWidth}
        rightPaneWidth={rightPaneWidth}
        onResize={onResize}
      />
    </div>
  );
}
