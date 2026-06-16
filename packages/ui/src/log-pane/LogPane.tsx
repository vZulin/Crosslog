import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { HorizontalLogScroller } from "./HorizontalLogScroller";
import { LogTextSelection } from "./LogTextSelection";
import { PaneHeader } from "./PaneHeader";
import { VirtualLogViewport } from "./VirtualLogViewport";
import { TimeOffsetEditor } from "../sync/TimeOffsetEditor";

export interface LogPaneProps {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly directorySource?: DirectorySource;
  readonly synchronizationTargetLineNumber?: number | null;
  readonly onClose: (paneId: string) => void;
  readonly onActivate: (paneId: string) => void;
  readonly onHorizontalScroll: (paneId: string, scrollLeft: number) => void;
  readonly onNavigateDirectory?: (paneId: string, direction: "previous" | "next") => void;
  readonly onTimeAnchorChange?: (paneId: string, lineNumber: number, timestamp: Date | null) => void;
  readonly onTimeOffsetChange?: (paneId: string, offset: LogPaneModel["timeOffset"]) => void;
}

export function LogPane({
  pane,
  lines,
  timestamps,
  directorySource,
  synchronizationTargetLineNumber,
  onClose,
  onActivate,
  onHorizontalScroll,
  onNavigateDirectory,
  onTimeAnchorChange,
  onTimeOffsetChange,
}: LogPaneProps) {
  return (
    <article
      aria-label={`Log pane ${pane.title}`}
      data-testid="log-pane"
      data-active={pane.active}
      style={{
        flex: `0 0 ${pane.width}px`,
        minWidth: `${pane.width}px`,
        borderInlineEnd: "1px solid #c8ced8",
      }}
      onFocus={() => onActivate(pane.id)}
      onClick={() => onActivate(pane.id)}
    >
      <PaneHeader
        paneId={pane.id}
        title={pane.title}
        directorySource={directorySource}
        onClose={() => onClose(pane.id)}
        onNavigateDirectory={onNavigateDirectory}
      />
      <div role="toolbar" aria-label={`Pane tools for ${pane.title}`}>
        <LogTextSelection title={pane.title} lines={lines} />
        <TimeOffsetEditor
          title={pane.title}
          value={pane.timeOffset}
          onChange={(offset) => onTimeOffsetChange?.(pane.id, offset)}
        />
      </div>
      <HorizontalLogScroller
        title={pane.title}
        scrollLeft={pane.horizontalScroll}
        onScrollLeftChange={(scrollLeft) => onHorizontalScroll(pane.id, scrollLeft)}
      >
        <VirtualLogViewport
          title={pane.title}
          lines={lines}
          timestamps={timestamps}
          synchronizationTargetLineNumber={synchronizationTargetLineNumber}
          onTimeAnchorChange={(lineNumber, timestamp) => onTimeAnchorChange?.(pane.id, lineNumber, timestamp)}
        />
      </HorizontalLogScroller>
      {pane.syncEnabled ? null : <p>Synchronization disabled for this pane</p>}
      <footer>{pane.status}</footer>
    </article>
  );
}
