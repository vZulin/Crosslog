import React from "react";

export interface PaneWorkspaceLayoutPane {
  readonly paneId: string;
  readonly desiredWidth: number;
  readonly horizontalContentWidth?: number;
}

export interface RenderedPaneWorkspaceWidth extends PaneWorkspaceLayoutPane {
  readonly renderedWidth: number;
  readonly renderedHorizontalContentWidth: number;
}

export interface PaneWorkspaceLayout {
  readonly renderedWidths: readonly RenderedPaneWorkspaceWidth[];
  readonly renderedWidthsByPaneId: ReadonlyMap<string, number>;
  readonly renderedHorizontalContentWidthsByPaneId: ReadonlyMap<string, number>;
  readonly workspaceWidth: number;
  readonly totalDesiredWidth: number;
  readonly totalRenderedWidth: number;
  readonly overflowing: boolean;
}

export interface PaneWorkspaceLayoutState extends PaneWorkspaceLayout {
  readonly workspaceRef: React.RefObject<HTMLDivElement | null>;
}

const unknownWorkspaceWidth = 0;

export function usePaneWorkspaceLayout(
  panes: readonly PaneWorkspaceLayoutPane[],
): PaneWorkspaceLayoutState {
  const workspaceRef = React.useRef<HTMLDivElement | null>(null);
  const [workspaceWidth, setWorkspaceWidth] = React.useState(unknownWorkspaceWidth);

  React.useEffect(() => {
    const element = workspaceRef.current;

    if (!element || typeof globalThis === "undefined") {
      return undefined;
    }

    const measurementTarget = element.parentElement ?? element;
    const measure = () => {
      const rect = measurementTarget.getBoundingClientRect();
      const nextWidth = Math.round(rect.width || measurementTarget.clientWidth || unknownWorkspaceWidth);

      setWorkspaceWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(measurementTarget);

      return () => observer.disconnect();
    }

    globalThis.addEventListener("resize", measure);

    return () => globalThis.removeEventListener("resize", measure);
  }, []);

  const layout = React.useMemo(
    () => computePaneWorkspaceLayout(panes, workspaceWidth),
    [panes, workspaceWidth],
  );

  return {
    ...layout,
    workspaceRef,
  };
}

export function computePaneWorkspaceLayout(
  panes: readonly PaneWorkspaceLayoutPane[],
  workspaceWidth: number,
): PaneWorkspaceLayout {
  const normalizedWorkspaceWidth = normalizeWidth(workspaceWidth);
  const totalDesiredWidth = panes.reduce(
    (total, pane) => total + normalizeDesiredWidth(pane.desiredWidth),
    0,
  );
  const shouldFill = panes.length > 0 && normalizedWorkspaceWidth > totalDesiredWidth;
  const overflowing = panes.length > 0 && totalDesiredWidth > normalizedWorkspaceWidth && normalizedWorkspaceWidth > 0;
  const extraWidth = shouldFill ? normalizedWorkspaceWidth - totalDesiredWidth : 0;
  const baseExtraWidth = shouldFill ? Math.floor(extraWidth / panes.length) : 0;
  let remainingExtraWidth = shouldFill ? extraWidth - baseExtraWidth * panes.length : 0;

  const renderedWidths = panes.map((pane) => {
    const desiredWidth = normalizeDesiredWidth(pane.desiredWidth);
    const remainderWidth = remainingExtraWidth > 0 ? 1 : 0;
    remainingExtraWidth -= remainderWidth;

    return {
      paneId: pane.paneId,
      desiredWidth,
      horizontalContentWidth: pane.horizontalContentWidth,
      renderedWidth: desiredWidth + baseExtraWidth + remainderWidth,
      renderedHorizontalContentWidth: Math.max(
        desiredWidth + baseExtraWidth + remainderWidth,
        normalizeWidth(pane.horizontalContentWidth ?? 0),
      ),
    };
  });
  const totalRenderedWidth = renderedWidths.reduce((total, pane) => total + pane.renderedWidth, 0);

  return {
    renderedWidths,
    renderedWidthsByPaneId: new Map(renderedWidths.map((pane) => [pane.paneId, pane.renderedWidth])),
    renderedHorizontalContentWidthsByPaneId: new Map(
      renderedWidths.map((pane) => [pane.paneId, pane.renderedHorizontalContentWidth]),
    ),
    workspaceWidth: normalizedWorkspaceWidth,
    totalDesiredWidth,
    totalRenderedWidth,
    overflowing,
  };
}

function normalizeDesiredWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return 0;
  }

  return Math.round(width);
}

function normalizeWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return unknownWorkspaceWidth;
  }

  return Math.round(width);
}
