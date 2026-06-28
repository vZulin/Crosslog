import React from "react";
import type { PlatformShellVariant, ThemeVariant } from "./shellPresentation";
import { redesignedShellTestIds } from "./testIds";

export interface ActivityRailShellProps {
  readonly activityRail: React.ReactNode;
  readonly paneWorkspace: React.ReactNode;
  readonly platformShellVariant: PlatformShellVariant;
  readonly statusBar: React.ReactNode;
  readonly themeVariant: ThemeVariant;
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
  platformShellVariant,
  popovers,
  statusBar,
  themeVariant,
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
      data-platform={platformShellVariant}
      data-testid={redesignedShellTestIds.crosslogShell}
      data-theme={themeVariant}
      id={redesignedShellTestIds.crosslogShell}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span hidden data-testid={redesignedShellTestIds.themeVariant}>
        {themeVariant}
      </span>
      {systemBanners ? (
        <aside aria-label="System notices" className="crosslog-shell__banners">
          {systemBanners}
        </aside>
      ) : null}
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
