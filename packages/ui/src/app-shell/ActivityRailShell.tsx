import React from "react";
import { redesignedShellTestIds } from "./testIds";

export interface ActivityRailShellProps {
  readonly activityRail: React.ReactNode;
  readonly paneWorkspace: React.ReactNode;
  readonly statusBar: React.ReactNode;
  readonly topbar: React.ReactNode;
  readonly className?: string;
  readonly popovers?: React.ReactNode;
  readonly systemBanners?: React.ReactNode;
  readonly onDragOver?: React.DragEventHandler<HTMLElement>;
  readonly onDrop?: React.DragEventHandler<HTMLElement>;
}

export function ActivityRailShell({
  activityRail,
  className,
  paneWorkspace,
  popovers,
  statusBar,
  systemBanners,
  topbar,
  onDragOver,
  onDrop,
}: ActivityRailShellProps) {
  const classes = ["crosslog-shell", className].filter(Boolean).join(" ");

  return (
    <main
      aria-label="Crosslog workspace"
      className={classes}
      data-testid={redesignedShellTestIds.crosslogShell}
      id={redesignedShellTestIds.crosslogShell}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {systemBanners}
      <section
        aria-label="Topbar"
        className="crosslog-shell__topbar"
        data-testid={redesignedShellTestIds.topbar}
        id={redesignedShellTestIds.topbar}
      >
        {topbar}
      </section>
      <nav
        aria-label="Activity rail"
        className="crosslog-shell__rail"
        data-testid={redesignedShellTestIds.activityRail}
        id={redesignedShellTestIds.activityRail}
      >
        {activityRail}
      </nav>
      <section
        aria-label="Pane workspace"
        className="crosslog-shell__workspace"
        data-testid={redesignedShellTestIds.paneWorkspace}
        id={redesignedShellTestIds.paneWorkspace}
      >
        {paneWorkspace}
      </section>
      {popovers}
      <footer
        aria-label="Workspace status"
        className="crosslog-shell__status"
        data-testid={redesignedShellTestIds.statusBar}
        id={redesignedShellTestIds.statusBar}
      >
        {statusBar}
      </footer>
    </main>
  );
}
