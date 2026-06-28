import React from "react";
import { MIN_PANE_WIDTH } from "@crosslog/core";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface PaneResizeBoundaryProps {
  readonly leftPaneTitle: string;
  readonly leftPaneWidth: number;
  readonly rightPaneWidth: number;
  readonly onResize: (delta: number) => void;
}

interface DragState {
  readonly startX: number;
  appliedDelta: number;
}

export function PaneResizeBoundary({
  leftPaneTitle,
  leftPaneWidth,
  rightPaneWidth,
  onResize,
}: PaneResizeBoundaryProps) {
  const dragState = React.useRef<DragState | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const maxLeftPaneWidth = Math.max(MIN_PANE_WIDTH, leftPaneWidth + rightPaneWidth - MIN_PANE_WIDTH);

  React.useEffect(() => {
    if (!dragging) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const currentDragState = dragState.current;

      if (!currentDragState) {
        return;
      }

      const totalDelta = event.clientX - currentDragState.startX;
      const incrementalDelta = totalDelta - currentDragState.appliedDelta;

      if (incrementalDelta !== 0) {
        currentDragState.appliedDelta = totalDelta;
        onResize(incrementalDelta);
      }
    };

    const handlePointerEnd = () => {
      dragState.current = null;
      setDragging(false);
    };

    globalThis.addEventListener("pointermove", handlePointerMove);
    globalThis.addEventListener("pointerup", handlePointerEnd);
    globalThis.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      globalThis.removeEventListener("pointermove", handlePointerMove);
      globalThis.removeEventListener("pointerup", handlePointerEnd);
      globalThis.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [dragging, onResize]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button > 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragState.current = { startX: event.clientX, appliedDelta: 0 };
    setDragging(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 80 : 40;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onResize(-step);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onResize(step);
    }
  };

  return (
    <div
      aria-label={`Resize boundary after ${leftPaneTitle}`}
      aria-orientation="vertical"
      aria-valuemax={maxLeftPaneWidth}
      aria-valuemin={MIN_PANE_WIDTH}
      aria-valuenow={Math.round(leftPaneWidth)}
      className="crosslog-pane-resize-boundary"
      data-dragging={dragging ? "true" : "false"}
      data-testid={redesignedShellTestIds.paneResizeBoundary}
      id={redesignedShellTestIds.paneResizeBoundary}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      role="separator"
      tabIndex={0}
    />
  );
}
