import React from "react";
import type { LogPane as LogPaneModel } from "@crosslog/core";
import { LogPane } from "../log-pane/LogPane";
import { AddPaneButton } from "./AddPaneButton";
import { PaneResizer } from "./PaneResizer";

export interface PaneRailPane {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly directoryLabel?: string;
}

export interface PaneRailProps {
  readonly panes: readonly PaneRailPane[];
  readonly onAddPane: () => void;
  readonly onSplitPane: () => void;
  readonly onClosePane: (paneId: string) => void;
  readonly onActivatePane: (paneId: string) => void;
  readonly onResizePane: (leftPaneId: string, delta: number) => void;
  readonly onHorizontalScroll: (paneId: string, scrollLeft: number) => void;
}

export function PaneRail({
  panes,
  onAddPane,
  onSplitPane,
  onClosePane,
  onActivatePane,
  onResizePane,
  onHorizontalScroll,
}: PaneRailProps) {
  return (
    <section aria-label="Log panes" data-testid="pane-rail" style={{ display: "flex", overflowX: "auto" }}>
      {panes.map((entry, index) => (
        <React.Fragment key={entry.pane.id}>
          <LogPane
            pane={entry.pane}
            lines={entry.lines}
            directoryLabel={entry.directoryLabel}
            onClose={onClosePane}
            onActivate={onActivatePane}
            onHorizontalScroll={onHorizontalScroll}
          />
          {index < panes.length - 1 ? (
            <PaneResizer
              leftPaneTitle={entry.pane.title}
              onResize={(delta) => onResizePane(entry.pane.id, delta)}
            />
          ) : null}
        </React.Fragment>
      ))}
      <AddPaneButton canSplit={panes.length > 0} onAddPane={onAddPane} onSplitPane={onSplitPane} />
    </section>
  );
}
