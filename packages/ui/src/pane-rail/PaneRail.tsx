import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { LogPane } from "../log-pane/LogPane";
import type { ClipboardWriter } from "../log-pane/LogTextSelection";
import { PaneResizer } from "./PaneResizer";
import { PaneWorkspace } from "./PaneWorkspace";

export interface PaneRailPane {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly directorySource?: DirectorySource;
  readonly synchronizationTargetLineNumber?: number | null;
}

export interface PaneRailProps {
  readonly panes: readonly PaneRailPane[];
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
  readonly openSearchPaneId?: string | null;
  readonly openTimeOffsetPaneId?: string | null;
  readonly searchFocusRequestSequence?: number;
  readonly onSearchOpenChange?: (paneId: string, open: boolean) => void;
  readonly onTimeOffsetOpenChange?: (paneId: string, open: boolean) => void;
  readonly onCopied?: (title: string) => void;
  readonly clipboard?: ClipboardWriter;
}

export function PaneRail({
  panes,
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
  openSearchPaneId = null,
  openTimeOffsetPaneId = null,
  searchFocusRequestSequence = 0,
  onSearchOpenChange,
  onTimeOffsetOpenChange,
  onCopied,
  clipboard,
}: PaneRailProps) {
  return (
    <PaneWorkspace>
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
            searchOpen={openSearchPaneId === entry.pane.id}
            timeOffsetOpen={openTimeOffsetPaneId === entry.pane.id}
            searchFocusRequestSequence={
              openSearchPaneId === entry.pane.id ? searchFocusRequestSequence : 0
            }
            onSearchOpenChange={onSearchOpenChange}
            onTimeOffsetOpenChange={onTimeOffsetOpenChange}
            onCopied={onCopied}
            clipboard={clipboard}
          />
          {index < panes.length - 1 ? (
            <PaneResizer
              leftPaneTitle={entry.pane.title}
              onResize={(delta) => onResizePane(entry.pane.id, delta)}
            />
          ) : null}
        </React.Fragment>
      ))}
    </PaneWorkspace>
  );
}
