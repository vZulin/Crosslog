import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { HorizontalLogScroller } from "./HorizontalLogScroller";
import { LogTextSelection, type ClipboardWriter } from "./LogTextSelection";
import { PaneHeader } from "./PaneHeader";
import { VirtualLogViewport } from "./VirtualLogViewport";
import { DeletedFileStatus } from "./DeletedFileStatus";
import { TimeOffsetPopover } from "../sync/TimeOffsetPopover";
import { PaneSearchPopover } from "../search/PaneSearchPopover";
import { redesignedShellTestIds } from "../app-shell/testIds";
import type { PaneHeaderLifecycleState } from "./useFileLifecycleEvents";

export interface LogPaneProps {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly directorySource?: DirectorySource;
  readonly lifecycleState?: PaneHeaderLifecycleState;
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
  readonly searchOpen?: boolean;
  readonly timeOffsetOpen?: boolean;
  readonly searchFocusRequestSequence?: number;
  readonly onSearchOpenChange?: (paneId: string, open: boolean) => void;
  readonly onTimeOffsetOpenChange?: (paneId: string, open: boolean) => void;
  readonly onCopied?: (title: string) => void;
  readonly clipboard?: ClipboardWriter;
}

export function LogPane({
  pane,
  lines,
  timestamps,
  directorySource,
  lifecycleState,
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
  searchOpen = false,
  timeOffsetOpen = false,
  searchFocusRequestSequence = 0,
  onSearchOpenChange,
  onTimeOffsetOpenChange,
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
        timeOffset={pane.timeOffset}
        searchOpen={searchOpen}
        timeOffsetOpen={timeOffsetOpen}
        directorySource={directorySource}
        lifecycleState={lifecycleState}
        onClose={() => onClose(pane.id)}
        onOpenSearch={() => {
          onActivate(pane.id);
          onTimeOffsetOpenChange?.(pane.id, false);
          onSearchOpenChange?.(pane.id, true);
        }}
        onOpenTimeOffset={() => {
          onActivate(pane.id);
          onSearchOpenChange?.(pane.id, false);
          onTimeOffsetOpenChange?.(pane.id, true);
        }}
        onNavigateDirectory={onNavigateDirectory}
      />
      {searchOpen ? (
        <PaneSearchPopover
          focusRequestSequence={searchFocusRequestSequence}
          title={pane.title}
          searchState={pane.searchState}
          onQueryChange={(query) => onSearchQueryChange?.(pane.id, query)}
          onRegexModeChange={(enabled) => onSearchRegexModeChange?.(pane.id, enabled)}
          onCaseSensitiveChange={(enabled) => onSearchCaseSensitiveChange?.(pane.id, enabled)}
          onPreviousMatch={() => onPreviousSearchMatch?.(pane.id)}
          onNextMatch={() => onNextSearchMatch?.(pane.id)}
          onClose={() => onSearchOpenChange?.(pane.id, false)}
        />
      ) : null}
      {timeOffsetOpen ? (
        <TimeOffsetPopover
          title={pane.title}
          value={pane.timeOffset}
          onApply={(offset) => onTimeOffsetChange?.(pane.id, offset)}
          onClose={() => onTimeOffsetOpenChange?.(pane.id, false)}
        />
      ) : null}
      <div className="crosslog-pane-tools" role="toolbar" aria-label={`Pane tools for ${pane.title}`}>
        <LogTextSelection title={pane.title} lines={lines} onCopied={onCopied} clipboard={clipboard} />
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
