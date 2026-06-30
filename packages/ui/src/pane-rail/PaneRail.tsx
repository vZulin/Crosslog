import React from "react";
import type { DirectorySource, LogPane as LogPaneModel } from "@crosslog/core";
import { LogPane } from "../log-pane/LogPane";
import type { ClipboardWriter } from "../log-pane/LogTextSelection";
import type { PaneHeaderLifecycleState } from "../log-pane/useFileLifecycleEvents";
import { PaneResizer } from "./PaneResizer";
import { PaneWorkspace } from "./PaneWorkspace";
import { usePaneWorkspaceLayout } from "./usePaneWorkspaceLayout";

export interface PaneRailPane {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly timestamps?: readonly (Date | null)[];
  readonly directorySource?: DirectorySource;
  readonly lifecycleState?: PaneHeaderLifecycleState;
  readonly synchronizationTargetLineNumber?: number | null;
}

export interface PaneRailProps {
  readonly panes: readonly PaneRailPane[];
  readonly onClosePane: (paneId: string) => void;
  readonly onActivatePane: (paneId: string) => void;
  readonly onResizePane: (leftPaneId: string, delta: number) => void;
  readonly onHorizontalScroll: (paneId: string, scrollLeft: number) => void;
  readonly onReorderPane?: (paneId: string, targetIndex: number) => void;
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
  onReorderPane,
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
  const paneWorkspaceLayout = usePaneWorkspaceLayout(
    panes.map((entry) => ({
      paneId: entry.pane.id,
      desiredWidth: entry.pane.width,
      horizontalContentWidth: estimateHorizontalContentWidth(entry.lines),
    })),
  );
  const [dragState, setDragState] = React.useState<{
    readonly paneId: string;
    readonly pointerId: number;
    readonly targetIndex: number;
  } | null>(null);

  React.useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isCurrentReorderPointer(event, dragState.pointerId)) {
        return;
      }

      const targetIndex = computeReorderTargetIndex(
        paneWorkspaceLayout.workspaceRef.current,
        dragState.paneId,
        event.clientX,
      );

      setDragState((current) =>
        current && isCurrentReorderPointer(event, current.pointerId) ? { ...current, targetIndex } : current,
      );
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (!isCurrentReorderPointer(event, dragState.pointerId)) {
        return;
      }

      const targetIndex = computeReorderTargetIndex(
        paneWorkspaceLayout.workspaceRef.current,
        dragState.paneId,
        event.clientX,
      );

      onReorderPane?.(dragState.paneId, targetIndex);
      setDragState(null);
    };
    const handlePointerCancel = (event: PointerEvent) => {
      if (isCurrentReorderPointer(event, dragState.pointerId)) {
        setDragState(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [dragState, onReorderPane, paneWorkspaceLayout.workspaceRef]);

  const handleReorderDragStart = React.useCallback(
    (paneId: string, event: React.PointerEvent<HTMLElement>) => {
      if (!onReorderPane) {
        return;
      }

      event.preventDefault();
      const pointerId = typeof event.pointerId === "number" ? event.pointerId : primaryPointerId;
      const targetIndex = computeReorderTargetIndex(
        paneWorkspaceLayout.workspaceRef.current,
        paneId,
        event.clientX,
      );

      setDragState({ paneId, pointerId, targetIndex });
    },
    [onReorderPane, paneWorkspaceLayout.workspaceRef],
  );

  return (
    <PaneWorkspace
      contentWidth={paneWorkspaceLayout.totalRenderedWidth}
      overflowing={paneWorkspaceLayout.overflowing}
      workspaceRef={paneWorkspaceLayout.workspaceRef}
    >
      {panes.map((entry, index) => (
        <React.Fragment key={entry.pane.id}>
          <LogPane
            pane={entry.pane}
            renderedWidth={paneWorkspaceLayout.renderedWidthsByPaneId.get(entry.pane.id)}
            horizontalContentWidth={paneWorkspaceLayout.renderedHorizontalContentWidthsByPaneId.get(entry.pane.id)}
            lines={entry.lines}
            timestamps={entry.timestamps}
            directorySource={entry.directorySource}
            lifecycleState={entry.lifecycleState}
            synchronizationTargetLineNumber={entry.synchronizationTargetLineNumber}
            onClose={onClosePane}
            onActivate={onActivatePane}
            onReorderDragStart={handleReorderDragStart}
            reorderDragging={dragState?.paneId === entry.pane.id}
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
              leftPaneWidth={entry.pane.width}
              rightPaneWidth={panes[index + 1]?.pane.width ?? entry.pane.width}
              onResize={(delta) => onResizePane(entry.pane.id, delta)}
            />
          ) : null}
        </React.Fragment>
      ))}
    </PaneWorkspace>
  );
}

const averageLogCharacterWidthPx = 7.2;
const horizontalContentPaddingPx = 48;
const minimumHorizontalContentWidthPx = 320;
const primaryPointerId = 1;

function estimateHorizontalContentWidth(lines: readonly string[]): number {
  const longestLineLength = lines.reduce((longest, line) => Math.max(longest, line.length), 0);

  return Math.max(
    minimumHorizontalContentWidthPx,
    Math.ceil(longestLineLength * averageLogCharacterWidthPx + horizontalContentPaddingPx),
  );
}

function computeReorderTargetIndex(
  workspace: HTMLElement | null,
  draggedPaneId: string,
  clientX: number,
): number {
  if (!workspace) {
    return 0;
  }

  const panes = Array.from(workspace.querySelectorAll<HTMLElement>('[data-testid="log-pane"]')).filter(
    (pane) => pane.dataset.paneId !== draggedPaneId,
  );

  return panes.reduce((targetIndex, pane) => {
    const rect = pane.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    return clientX > midpoint ? targetIndex + 1 : targetIndex;
  }, 0);
}

function isCurrentReorderPointer(event: PointerEvent, pointerId: number): boolean {
  return typeof event.pointerId !== "number" || event.pointerId === pointerId;
}
