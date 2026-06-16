import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import {
  createLogPane,
  createLogPaneState,
  createSynchronizationPlan,
  createTimeAnchorPane,
  createTimestampRecognitionService,
  defaultTimestampFormats,
  logPaneReducer,
} from "@crosslog/core";
import { FuturePaneToolbarSlot } from "../log-pane/FuturePaneToolbarSlot";
import { PaneRail } from "../pane-rail/PaneRail";
import { SynchronizationToggle } from "../sync/SynchronizationToggle";
import { TimestampConfigError } from "../sync/TimestampConfigError";
import { getPaneOffset, useSynchronizationStore } from "../sync/useSynchronizationStore";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
}

export function AppShell({ platform }: AppShellProps) {
  const [state, dispatch] = React.useReducer(logPaneReducer, createLogPaneState());
  const synchronizationEnabled = useSynchronizationStore((store) => store.enabled);
  const syncOffsets = useSynchronizationStore((store) => store.offsets);
  const syncTargets = useSynchronizationStore((store) => store.targets);
  const excludedPaneIds = useSynchronizationStore((store) => store.excludedPaneIds);
  const setSynchronizationEnabled = useSynchronizationStore((store) => store.setEnabled);
  const setSynchronizationAnchor = useSynchronizationStore((store) => store.setAnchor);
  const setPaneOffset = useSynchronizationStore((store) => store.setPaneOffset);
  const setPlanResult = useSynchronizationStore((store) => store.setPlanResult);
  const timestampService = React.useMemo(
    () => createTimestampRecognitionService(defaultTimestampFormats),
    [],
  );
  const panes = state.panes.map((pane) => {
    const lines = getSampleLines(pane.title);
    const recognizedLines = lines.map((line, index) => timestampService.recognizeLine(index + 1, line, pane.id));

    return {
      pane: {
        ...pane,
        timeOffset: getPaneOffset(syncOffsets, pane.id),
        syncEnabled: synchronizationEnabled,
      },
      lines,
      timestamps: recognizedLines.map((line) => line.timestamp),
      synchronizationTargetLineNumber: syncTargets[pane.id] ?? null,
      directoryLabel: pane.sourceRef === "source-directory" ? "logs/2026" : undefined,
    };
  });

  const handleAnchorChange = (paneId: string, _lineNumber: number, timestamp: Date | null) => {
    const anchor = createTimeAnchorPane(paneId, timestamp, "scroll");
    setSynchronizationAnchor(anchor);

    if (!anchor || !synchronizationEnabled) {
      setPlanResult([], []);
      return;
    }

    const plan = createSynchronizationPlan({
      enabled: synchronizationEnabled,
      anchorPaneId: anchor.paneId,
      anchorTimestamp: anchor.anchorTimestamp,
      panes: panes.map((entry) => ({
        paneId: entry.pane.id,
        timeOffset: entry.pane.timeOffset,
        syncEnabled: entry.pane.syncEnabled,
        lines: entry.timestamps.map((lineTimestamp, index) => ({
          lineNumber: index + 1,
          timestamp: lineTimestamp,
        })),
      })),
    });

    setPlanResult(plan.targets, plan.excludedPaneIds);
  };

  const handleSynchronizationEnabledChange = (enabled: boolean) => {
    setSynchronizationEnabled(enabled);

    if (!enabled) {
      setPlanResult([], []);
    }
  };

  const unsupportedPaneCount = excludedPaneIds.length;

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
        <>
          <div role="toolbar" aria-label="Global tools">
            <SynchronizationToggle
              enabled={synchronizationEnabled}
              onEnabledChange={handleSynchronizationEnabledChange}
            />
            {unsupportedPaneCount > 0 ? (
              <span aria-live="polite">{unsupportedPaneCount} untimed pane excluded</span>
            ) : null}
          </div>
          <TimestampConfigError message={null} />
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
            onTimeAnchorChange={handleAnchorChange}
            onTimeOffsetChange={setPaneOffset}
          />
        </>
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
