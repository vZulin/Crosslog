import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { HorizontalLogScroller } from "./HorizontalLogScroller";
import { LogTextSelection, type ClipboardWriter } from "./LogTextSelection";
import { PaneHeader } from "./PaneHeader";
import { VirtualLogViewport } from "./VirtualLogViewport";
import { DeletedFileStatus } from "./DeletedFileStatus";
import { TimeOffsetEditor } from "../sync/TimeOffsetEditor";
import { PaneSearchControls } from "../search/PaneSearchControls";
import { redesignedShellTestIds } from "../app-shell/testIds";

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
  readonly onSearchQueryChange?: (paneId: string, query: string) => void;
  readonly onSearchRegexModeChange?: (paneId: string, enabled: boolean) => void;
  readonly onSearchCaseSensitiveChange?: (paneId: string, enabled: boolean) => void;
  readonly onPreviousSearchMatch?: (paneId: string) => void;
  readonly onNextSearchMatch?: (paneId: string) => void;
  readonly onCopied?: (title: string) => void;
  readonly clipboard?: ClipboardWriter;
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
  onSearchQueryChange,
  onSearchRegexModeChange,
  onSearchCaseSensitiveChange,
  onPreviousSearchMatch,
  onNextSearchMatch,
  onCopied,
  clipboard,
}: LogPaneProps) {
  const activeSearchMatch =
    pane.searchState.currentMatchIndex === null
      ? null
      : pane.searchState.matches[pane.searchState.currentMatchIndex] ?? null;

  return (
    <article
      className="crosslog-log-pane"
      aria-label={`Log pane ${pane.title}`}
      data-testid={redesignedShellTestIds.logPane}
      id={redesignedShellTestIds.logPane}
      data-active={pane.active}
      style={{
        inlineSize: `${pane.width}px`,
      }}
      onFocus={() => onActivate(pane.id)}
      onClick={() => onActivate(pane.id)}
    >
      <PaneHeader
        active={pane.active}
        paneId={pane.id}
        title={pane.title}
        directorySource={directorySource}
        onClose={() => onClose(pane.id)}
        onNavigateDirectory={onNavigateDirectory}
      />
      <div className="crosslog-pane-tools" role="toolbar" aria-label={`Pane tools for ${pane.title}`}>
        <LogTextSelection title={pane.title} lines={lines} onCopied={onCopied} clipboard={clipboard} />
        <PaneSearchControls
          title={pane.title}
          searchState={pane.searchState}
          onQueryChange={(query) => onSearchQueryChange?.(pane.id, query)}
          onRegexModeChange={(enabled) => onSearchRegexModeChange?.(pane.id, enabled)}
          onCaseSensitiveChange={(enabled) => onSearchCaseSensitiveChange?.(pane.id, enabled)}
          onPreviousMatch={() => onPreviousSearchMatch?.(pane.id)}
          onNextMatch={() => onNextSearchMatch?.(pane.id)}
        />
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
          searchMatches={pane.searchState.matches}
          activeSearchMatchLineNumber={activeSearchMatch?.lineNumber ?? null}
          maxVisibleLines={400}
          synchronizationTargetLineNumber={synchronizationTargetLineNumber}
          onTimeAnchorChange={(lineNumber, timestamp) => onTimeAnchorChange?.(pane.id, lineNumber, timestamp)}
        />
      </HorizontalLogScroller>
      {pane.status === "deleted" ? <DeletedFileStatus title={pane.title} /> : null}
      {pane.syncEnabled ? null : <p>Synchronization disabled for this pane</p>}
      <footer className="crosslog-pane-status">{pane.status}</footer>
    </article>
  );
}
