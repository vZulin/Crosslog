import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { HorizontalLogScroller } from "./HorizontalLogScroller";
import { LogTextSelection, type ClipboardWriter } from "./LogTextSelection";
import { PaneHeader } from "./PaneHeader";
import { VirtualLogViewport, type LogViewportNavigationKind } from "./VirtualLogViewport";
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
  readonly renderedWidth?: number;
  readonly horizontalContentWidth?: number;
  readonly synchronizationTargetLineNumber?: number | null;
  readonly synchronizationTargetVisualLineOffset?: number | null;
  readonly onClose: (paneId: string) => void;
  readonly onActivate: (paneId: string) => void;
  readonly onReorderDragStart?: (paneId: string, event: React.PointerEvent<HTMLElement>) => void;
  readonly reorderDragging?: boolean;
  readonly onHorizontalScroll: (paneId: string, scrollLeft: number) => void;
  readonly onNavigateDirectory?: (paneId: string, direction: "previous" | "next") => void;
  readonly onTimeAnchorChange?: (
    paneId: string,
    lineNumber: number,
    timestamp: Date | null,
    visualLineOffset: number,
    navigationKind: LogViewportNavigationKind,
  ) => void;
  readonly onTimeOffsetChange?: (paneId: string, offset: LogPaneModel["timeOffset"]) => void;
  readonly onSearchQueryChange?: (paneId: string, query: string) => void;
  readonly onSearchRegexModeChange?: (paneId: string, enabled: boolean) => void;
  readonly onSearchCaseSensitiveChange?: (paneId: string, enabled: boolean) => void;
  readonly onPreviousSearchMatch?: (paneId: string) => void;
  readonly onNextSearchMatch?: (paneId: string) => void;
  readonly searchOpen?: boolean;
  readonly searchHighlightsVisible?: boolean;
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
  renderedWidth,
  horizontalContentWidth,
  synchronizationTargetLineNumber,
  synchronizationTargetVisualLineOffset,
  onClose,
  onActivate,
  onReorderDragStart,
  reorderDragging = false,
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
  searchHighlightsVisible = false,
  timeOffsetOpen = false,
  searchFocusRequestSequence = 0,
  onSearchOpenChange,
  onTimeOffsetOpenChange,
  onCopied,
  clipboard,
}: LogPaneProps) {
  const searchButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const timeOffsetButtonRef = React.useRef<HTMLButtonElement | null>(null);
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
      data-pane-id={pane.id}
      style={{
        inlineSize: `${renderedWidth ?? pane.width}px`,
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
        searchButtonRef={searchButtonRef}
        timeOffsetButtonRef={timeOffsetButtonRef}
        reorderDragging={reorderDragging}
        onClose={() => onClose(pane.id)}
        onReorderDragStart={
          onReorderDragStart ? (event) => onReorderDragStart(pane.id, event) : undefined
        }
        onOpenSearch={() => {
          onActivate(pane.id);
          if (searchOpen) {
            onSearchOpenChange?.(pane.id, false);
            return;
          }

          onTimeOffsetOpenChange?.(pane.id, false);
          onSearchOpenChange?.(pane.id, true);
        }}
        onOpenTimeOffset={() => {
          onActivate(pane.id);
          if (timeOffsetOpen) {
            onTimeOffsetOpenChange?.(pane.id, false);
            return;
          }

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
          returnFocusRef={searchButtonRef}
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
          returnFocusRef={timeOffsetButtonRef}
          onApply={(offset) => onTimeOffsetChange?.(pane.id, offset)}
          onClose={() => onTimeOffsetOpenChange?.(pane.id, false)}
        />
      ) : null}
      <LogTextSelection title={pane.title} lines={lines} onCopied={onCopied} clipboard={clipboard}>
        <HorizontalLogScroller
          title={pane.title}
          scrollLeft={pane.horizontalScroll}
          contentWidth={horizontalContentWidth}
          onScrollLeftChange={(scrollLeft) => onHorizontalScroll(pane.id, scrollLeft)}
        >
          <VirtualLogViewport
            title={pane.title}
            lines={lines}
            timestamps={timestamps}
            searchMatches={pane.searchState.matches}
            searchHighlightsVisible={searchHighlightsVisible}
            activeSearchMatch={searchHighlightsVisible ? activeSearchMatch : null}
            maxVisibleLines={400}
            synchronizationTargetLineNumber={synchronizationTargetLineNumber}
            synchronizationTargetVisualLineOffset={synchronizationTargetVisualLineOffset}
            onTimeAnchorChange={(lineNumber, timestamp, visualLineOffset, navigationKind) =>
              onTimeAnchorChange?.(pane.id, lineNumber, timestamp, visualLineOffset, navigationKind)
            }
          />
        </HorizontalLogScroller>
      </LogTextSelection>
      {pane.status === "deleted" ? <DeletedFileStatus title={pane.title} /> : null}
    </article>
  );
}
