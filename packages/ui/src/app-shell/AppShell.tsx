import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import { createLogPane, createLogPaneState, logPaneReducer } from "@crosslog/core";
import { FuturePaneToolbarSlot } from "../log-pane/FuturePaneToolbarSlot";
import { PaneRail } from "../pane-rail/PaneRail";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
}

export function AppShell({ platform }: AppShellProps) {
  const [state, dispatch] = React.useReducer(logPaneReducer, createLogPaneState());
  const panes = state.panes.map((pane) => ({
    pane,
    lines: getSampleLines(pane.title),
    directoryLabel: pane.sourceRef === "source-directory" ? "logs/2026" : undefined,
  }));

  return (
    <main aria-label="Crosslog workspace">
      {state.panes.length === 0 ? (
        <section aria-label="Empty workspace">
          <h1>Crosslog</h1>
          <button
            type="button"
            onClick={() => {
              samplePanes.forEach((pane) => dispatch({ type: "addPane", pane }));
            }}
          >
            Open logs
          </button>
          <p>{platform.kind === "web" ? "Web workspace" : "Desktop workspace"}</p>
        </section>
      ) : (
        <PaneRail
          panes={panes}
          onAddPane={() => dispatch({ type: "addPane", pane: createAddedPane(state.nextPaneNumber) })}
          onSplitPane={() => dispatch({ type: "splitPane" })}
          onClosePane={(paneId) => dispatch({ type: "closePane", paneId })}
          onActivatePane={(paneId) => dispatch({ type: "setActivePane", paneId })}
          onResizePane={(leftPaneId, delta) => dispatch({ type: "resizePane", leftPaneId, delta })}
          onHorizontalScroll={(paneId, scrollLeft) =>
            dispatch({ type: "setHorizontalScroll", paneId, scrollLeft })
          }
        />
      )}
      <FuturePaneToolbarSlot />
    </main>
  );
}

const samplePanes = [
  createLogPane({
    id: "pane-app",
    title: "app.log",
    sourceRef: "source-app",
    active: true,
    width: 520,
    status: "ready",
  }),
  createLogPane({
    id: "pane-service",
    title: "service.log",
    sourceRef: "source-service",
    width: 520,
    status: "ready",
  }),
  createLogPane({
    id: "pane-directory",
    title: "latest.log",
    sourceRef: "source-directory",
    width: 520,
    status: "ready",
  }),
];

function createAddedPane(nextPaneNumber: number) {
  return {
    title: `adhoc-${nextPaneNumber}.log`,
    sourceRef: `source-adhoc-${nextPaneNumber}`,
    width: 480,
    status: "ready" as const,
  };
}

function getSampleLines(title: string): readonly string[] {
  return [
    `2026-06-16T09:00:00.000Z ${title} boot sequence started with a deliberately long line for horizontal scrolling verification`,
    `2026-06-16T09:00:01.250Z ${title} connected to upstream service`,
    `2026-06-16T09:00:02.500Z ${title} processed request id=42 status=ok`,
    `2026-06-16T09:00:03.750Z ${title} completed comparison sample`,
  ];
}
