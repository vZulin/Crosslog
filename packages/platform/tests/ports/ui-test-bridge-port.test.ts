import { describe, expect, it } from "vitest";
import {
  isUiTestAction,
  uiTestActions,
  updateUiTestPaneNavigation,
  updateUiTestSynchronizationTargetLine,
  type UiTestShellState,
} from "../../src/ports/ui-test-bridge-port";
import { formatUiTestShellState } from "../../src/tauri/tauri-ui-test-bridge";

describe("UI test bridge shell state contract", () => {
  it("updates synchronization target evidence without republishing the shell", () => {
    const formattedState = "state=logs;syncTargetLine=2;visibleRows=34";

    expect(updateUiTestSynchronizationTargetLine(formattedState, 42)).toContain("syncTargetLine=42");
    expect(updateUiTestSynchronizationTargetLine(formattedState, null)).toContain("syncTargetLine=unknown");
  });

  it("updates committed pane navigation evidence without republishing the shell", () => {
    const formattedState = [
      "state=logs",
      "paneOrder=app.log",
      "selectedLine=1",
      "maxGutterDigits=3",
      "lastNavigation=none",
      "syncTargetLine=unknown",
      "renderedRows=120",
      "visibleRows=34",
    ].join(";");

    expect(updateUiTestPaneNavigation(formattedState, {
      paneOrder: ["app.log", "service.log"],
      selectedLineNumber: 42,
      maxGutterDigitCount: 5,
      lastNavigation: "wheel",
      syncTargetLineNumber: 44,
      renderedRowCount: 600,
      visibleRowCount: 36,
    })).toBe([
      "state=logs",
      "paneOrder=app.log,service.log",
      "selectedLine=42",
      "maxGutterDigits=5",
      "lastNavigation=wheel",
      "syncTargetLine=44",
      "renderedRows=600",
      "visibleRows=36",
    ].join(";"));
  });

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
    expect(formatUiTestShellState(state)).toContain("themePreference=system");
    expect(formatUiTestShellState(state)).toContain("platform=windows");
    expect(formatUiTestShellState(state)).toContain("obsolete=visible");
    expect(formatUiTestShellState(state)).toContain("workspaceOverflow=on");
    expect(formatUiTestShellState(state)).toContain("rightEdgeAligned=on");
    expect(formatUiTestShellState(state)).toContain("workspaceWidth=1440");
    expect(formatUiTestShellState(state)).toContain("workspaceContentWidth=1680");
    expect(formatUiTestShellState(state)).toContain("rightEdgeGap=1");
    expect(formatUiTestShellState(state)).toContain("darkThemeColors=on");
    expect(formatUiTestShellState(state)).toContain("darkThemeColorMismatches=none");
    expect(formatUiTestShellState(state)).toContain("iconCentering=off");
    expect(formatUiTestShellState(state)).toContain("iconCenteringFailures=pane-close");
    expect(formatUiTestShellState(state)).toContain("paneOrder=app.log,service.log");
    expect(formatUiTestShellState(state)).toContain("selectedLine=2");
    expect(formatUiTestShellState(state)).toContain("maxGutterDigits=3");
    expect(formatUiTestShellState(state)).toContain("lastNavigation=keyboard");
    expect(formatUiTestShellState(state)).toContain("syncTargetLine=2");
    expect(formatUiTestShellState(state)).toContain("searchHighlights=visible");
    expect(formatUiTestShellState(state)).toContain("searchHighlightCount=2");
    expect(formatUiTestShellState(state)).toContain("copyAction=visible");
    expect(formatUiTestShellState(state)).toContain("copyActionAnchored=on");
    expect(formatUiTestShellState(state)).toContain("copyActionBounded=on");
    expect(formatUiTestShellState(state)).toContain("copiedText=absent");
    expect(formatUiTestShellState(state)).toContain("timeOffsetValidBoundary=accepted");
    expect(formatUiTestShellState(state)).toContain("timeOffsetInvalidBoundary=rejected");
    expect(formatUiTestShellState(state)).toContain("timeOffsetBlankField=zero");
    expect(formatUiTestShellState(state)).toContain("timeOffsetInvalidFields=hours,minutes,seconds,milliseconds");
    expect(formatUiTestShellState(state)).toContain("sourceOpening=opened");
    expect(formatUiTestShellState(state)).toContain("sourceEntry=empty-workspace");
    expect(formatUiTestShellState(state)).toContain("futureFiles=disabled");
    expect(formatUiTestShellState(state)).toContain("futureSearch=disabled");
    expect(formatUiTestShellState(state)).toContain("futureCommand=disabled");
    expect(formatUiTestShellState(state)).toContain("settings=enabled");
    expect(formatUiTestShellState(state)).toContain("settingsSurface=open");
    expect(formatUiTestShellState(state)).toContain("syncVisual=active");
    expect(formatUiTestShellState(state)).toContain("syncPressed=on");
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
    expect(formatUiTestShellState(state)).toContain("darkThemeColors=on");
    expect(formatUiTestShellState(state)).toContain("iconCentering=off");
  });

  it("keeps lifecycle and source simulation actions behind the supported UI test action contract", () => {
    expect(uiTestActions).toEqual([
      "openSampleLogs",
      "openLargeLog",
      "copyFirstPane",
      "toggleSynchronization",
      "openSettings",
      "closeSettings",
      "setThemeSystem",
      "setThemeLight",
      "setThemeDark",
      "reorderFirstPaneAfterSecond",
      "dropNativeSampleSource",
      "keyboardNavigateActivePaneDown",
      "wheelNavigateActivePaneDown",
      "openActivePaneSearch",
      "setActivePaneSearchQuery",
      "setActivePaneInvalidSearch",
      "closeActivePaneSearch",
      "showFirstPaneCopyMenu",
      "dismissCopyMenu",
      "openEmptyDirectory",
      "navigatePreviousDirectoryFile",
      "navigateNextDirectoryFile",
      "discoverNewerDirectoryFile",
      "openActivePaneTimeOffset",
      "setActivePaneTimeOffset",
      "appendActiveFile",
      "deleteActiveFile",
      "replaceActiveFile",
    ]);
    expect(isUiTestAction("appendActiveFile")).toBe(true);
    expect(isUiTestAction("setThemeDark")).toBe(true);
    expect(isUiTestAction("showFirstPaneCopyMenu")).toBe(true);
    expect(isUiTestAction("openEmptyDirectory")).toBe(true);
    expect(isUiTestAction("showProductLifecycleToolbar")).toBe(false);
  });
});

function createShellState(overrides: {
  readonly obsoleteControlVisibility: UiTestShellState["obsoleteControlVisibility"];
  readonly workspaceLayout: UiTestShellState["workspaceLayout"];
}): UiTestShellState {
  return {
    status: "logs",
    themeVariant: "dark",
    themePreference: "system",
    platformShellVariant: "windows",
    paneCount: 2,
    paneTitles: ["app.log", "service.log"],
    activePaneTitle: "app.log",
    synchronizationEnabled: true,
    syncVisualState: "active",
    syncPressedState: true,
    paneSearchStatus: "closed",
    paneSearchPaneTitle: null,
    timeOffsetPopoverStatus: "closed",
    timeOffsetPaneTitle: null,
    settingsSurfaceStatus: "open",
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
    darkThemeColors: {
      matchesAuthoritativeMockup: true,
      mismatchedSurfaces: [],
    },
    iconCentering: {
      allCentered: false,
      offCenterControls: ["pane-close"],
    },
    paneNavigation: {
      paneOrder: ["app.log", "service.log"],
      selectedLineNumber: 2,
      maxGutterDigitCount: 3,
      lastNavigation: "keyboard",
      syncTargetLineNumber: 2,
      renderedRowCount: 120,
      visibleRowCount: 34,
    },
    searchHighlights: {
      visible: true,
      count: 2,
    },
    copyAction: {
      visible: true,
      pointerAnchored: true,
      viewportBounded: true,
      copiedProductTextVisible: false,
    },
    timeOffsetValidation: {
      validBoundaryAccepted: true,
      invalidBoundaryRejected: true,
      blankFieldAppliesAsZero: true,
      invalidFields: ["hours", "minutes", "seconds", "milliseconds"],
    },
    sourceOpening: {
      status: "opened",
      entryPoint: "empty-workspace",
      selectedSourceKind: "file",
      openedSourceCount: 1,
      pickerRequestCount: 1,
      cancelledPickerCount: 0,
      fixtureSamplePaneCount: 0,
    },
    futureControls: {
      activityRailOpenSources: "disabled",
      activityRailSearch: "disabled",
      topbarCommandField: "disabled",
      activityRailSettings: "enabled",
    },
  };
}
