import React from "react";

export interface PaneWorkspaceProps {
  readonly children: React.ReactNode;
  readonly contentWidth?: number;
  readonly overflowing?: boolean;
  readonly workspaceRef?: React.RefObject<HTMLDivElement | null>;
}

export function PaneWorkspace({
  children,
  contentWidth,
  overflowing = false,
  workspaceRef,
}: PaneWorkspaceProps) {
  const contentStyle =
    typeof contentWidth === "number" && Number.isFinite(contentWidth) && contentWidth > 0
      ? { inlineSize: overflowing ? `${contentWidth}px` : "100%" }
      : undefined;

  return (
    <div className="crosslog-pane-workspace" data-overflowing={overflowing ? "true" : "false"} ref={workspaceRef}>
      <div className="crosslog-pane-workspace__content" data-testid="pane-rail" style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
