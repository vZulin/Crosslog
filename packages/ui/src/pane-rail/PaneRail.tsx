import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { LogPane } from "../log-pane/LogPane";
import { AddPaneButton } from "./AddPaneButton";
import { PaneResizer } from "./PaneResizer";

export interface PaneRailPane {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly directorySource?: DirectorySource;
  readonly synchronizationTargetLineNumber?: number | null;
}

export interface PaneRailProps {
  readonly panes: readonly PaneRailPane[];
  readonly onAddPane: () => void;
  readonly onSplitPane: () => void;
  readonly onClosePane: (paneId: string) => void;
  readonly onActivatePane: (paneId: string) => void;
  readonly onResizePane: (leftPaneId: string, delta: number) => void;
  readonly onHorizontalScroll: (paneId: string, scrollLeft: number) => void;
  readonly onNavigateDirectory?: (paneId: string, direction: "previous" | "next") => void;
  readonly onTimeAnchorChange?: (paneId: string, lineNumber: number, timestamp: Date | null) => void;
  readonly onTimeOffsetChange?: (paneId: string, offset: LogPaneModel["timeOffset"]) => void;
  readonly onSearchQueryChange?: (paneId: string, query: string) => void;
  readonly onSearchRegexModeChange?: (paneId: string, enabled: boolean) => void;
  readonly onSearchCaseSensitiveChange?: (paneId: string, enabled: boolean) => void;
  readonly onPreviousSearchMatch?: (paneId: string) => void;
  readonly onNextSearchMatch?: (paneId: string) => void;
}

export function PaneRail({
  panes,
  onAddPane,
  onSplitPane,
  onClosePane,
  onActivatePane,
  onResizePane,
  onHorizontalScroll,
  onNavigateDirectory,
  onTimeAnchorChange,
  onTimeOffsetChange,
  onSearchQueryChange,
  onSearchRegexModeChange,
  onSearchCaseSensitiveChange,
  onPreviousSearchMatch,
  onNextSearchMatch,
}: PaneRailProps) {
  return (
    <section aria-label="Log panes" data-testid="pane-rail" style={{ display: "flex", overflowX: "auto" }}>
      {panes.map((entry, index) => (
        <React.Fragment key={entry.pane.id}>
          <LogPane
            pane={entry.pane}
            lines={entry.lines}
            timestamps={entry.timestamps}
            directorySource={entry.directorySource}
            synchronizationTargetLineNumber={entry.synchronizationTargetLineNumber}
            onClose={onClosePane}
            onActivate={onActivatePane}
            onHorizontalScroll={onHorizontalScroll}
            onNavigateDirectory={onNavigateDirectory}
            onTimeAnchorChange={onTimeAnchorChange}
            onTimeOffsetChange={onTimeOffsetChange}
            onSearchQueryChange={onSearchQueryChange}
            onSearchRegexModeChange={onSearchRegexModeChange}
            onSearchCaseSensitiveChange={onSearchCaseSensitiveChange}
            onPreviousSearchMatch={onPreviousSearchMatch}
            onNextSearchMatch={onNextSearchMatch}
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
