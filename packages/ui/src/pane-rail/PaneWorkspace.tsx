import React from "react";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface PaneWorkspaceProps {
  readonly children: React.ReactNode;
}

export function PaneWorkspace({ children }: PaneWorkspaceProps) {
  return (
    <div className="crosslog-pane-workspace">
      <div className="crosslog-pane-workspace__content" data-testid="pane-rail">
        {children}
      </div>
      <div
        aria-hidden="true"
        className="crosslog-pane-workspace__scrollbar"
        data-testid={redesignedShellTestIds.workspaceScrollbar}
        id={redesignedShellTestIds.workspaceScrollbar}
      >
        <div
          className="crosslog-pane-workspace__scrollbar-thumb"
          data-testid={redesignedShellTestIds.workspaceScrollbarThumb}
          id={redesignedShellTestIds.workspaceScrollbarThumb}
        />
      </div>
    </div>
  );
}
