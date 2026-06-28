import { describe, expect, it } from "vitest";
import type { UiTestShellState } from "../../src/ports/ui-test-bridge-port";
import { formatUiTestShellState } from "../../src/tauri/tauri-ui-test-bridge";

describe("UI test bridge shell state contract", () => {
  it("formats theme, platform, obsolete-control visibility, and workspace layout fields", () => {
    const state = createShellState({
      obsoleteControlVisibility: {
        workspaceToolbar: true,
        paneCopyToolbar: false,
        discoverNewerDirectoryFile: false,
        appendLiveLine: false,
        deleteActiveFile: false,
        replaceActiveFile: false,
        splitButton: false,
        synchronizeByTimeText: false,
        syncStateText: false,
        resizeDecreaseButton: false,
        resizeIncreaseButton: false,
        paneReadyFooter: false,
      },
      workspaceLayout: {
        workspaceWidthPx: 1440,
        workspaceContentWidthPx: 1680,
        workspaceRightPx: 1440,
        rightmostPaneRightPx: 1439,
        rightEdgeGapPx: 1,
        rightmostPaneAlignedToWorkspace: true,
        horizontalOverflow: true,
      },
    });

    expect(formatUiTestShellState(state)).toContain("theme=dark");
    expect(formatUiTestShellState(state)).toContain("platform=windows");
    expect(formatUiTestShellState(state)).toContain("obsolete=visible");
    expect(formatUiTestShellState(state)).toContain("workspaceOverflow=on");
    expect(formatUiTestShellState(state)).toContain("rightEdgeAligned=on");
    expect(formatUiTestShellState(state)).toContain("workspaceWidth=1440");
    expect(formatUiTestShellState(state)).toContain("workspaceContentWidth=1680");
    expect(formatUiTestShellState(state)).toContain("rightEdgeGap=1");
  });

  it("formats absent obsolete controls and unknown layout measurements", () => {
    const state = createShellState({
      obsoleteControlVisibility: {
        workspaceToolbar: false,
        paneCopyToolbar: false,
        discoverNewerDirectoryFile: false,
        appendLiveLine: false,
        deleteActiveFile: false,
        replaceActiveFile: false,
        splitButton: false,
        synchronizeByTimeText: false,
        syncStateText: false,
        resizeDecreaseButton: false,
        resizeIncreaseButton: false,
        paneReadyFooter: false,
      },
      workspaceLayout: {
        workspaceWidthPx: null,
        workspaceContentWidthPx: null,
        workspaceRightPx: null,
        rightmostPaneRightPx: null,
        rightEdgeGapPx: null,
        rightmostPaneAlignedToWorkspace: null,
        horizontalOverflow: false,
      },
    });

    expect(formatUiTestShellState(state)).toContain("obsolete=absent");
    expect(formatUiTestShellState(state)).toContain("workspaceOverflow=off");
    expect(formatUiTestShellState(state)).toContain("rightEdgeAligned=unknown");
    expect(formatUiTestShellState(state)).toContain("workspaceWidth=unknown");
  });
});

function createShellState(overrides: {
  readonly obsoleteControlVisibility: UiTestShellState["obsoleteControlVisibility"];
  readonly workspaceLayout: UiTestShellState["workspaceLayout"];
}): UiTestShellState {
  return {
    status: "logs",
    themeVariant: "dark",
    platformShellVariant: "windows",
    paneCount: 2,
    paneTitles: ["app.log", "service.log"],
    activePaneTitle: "app.log",
    synchronizationEnabled: true,
    paneSearchStatus: "closed",
    paneSearchPaneTitle: null,
    timeOffsetPopoverStatus: "closed",
    timeOffsetPaneTitle: null,
    activePaneOffsetLabel: "+0000-00-00 00:00:00.000",
    copiedPaneTitle: null,
    sessionSnapshotStatus: "written",
    redesignedRegions: ["crosslog-shell", "topbar", "pane-workspace"],
    directoryName: null,
    directorySelectedFileTitle: null,
    directoryPreviousAvailable: false,
    directoryNextAvailable: false,
    directoryFileCount: 0,
    directoryEmptyVisible: false,
    fileLifecycleSummary: "none",
    obsoleteControlVisibility: overrides.obsoleteControlVisibility,
    workspaceLayout: overrides.workspaceLayout,
  };
}
