import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriUiTestBridge } from "../../src/tauri/tauri-ui-test-bridge";
import type { UiTestShellState } from "../../src/ports/ui-test-bridge-port";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("TauriUiTestBridge", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockImplementation((command: string) =>
      command === "is_ui_test_mode" ? Promise.resolve(true) : Promise.resolve(undefined),
    );
  });

  it("serializes native title updates when shell snapshots overlap", async () => {
    let releaseFirstUpdate!: () => void;
    const firstUpdateFinished = new Promise<void>((resolve) => {
      releaseFirstUpdate = resolve;
    });
    const nativeStates: string[] = [];

    invokeMock.mockImplementation(async (command: string, payload: { state: string }) => {
      if (command === "is_ui_test_mode") {
        return true;
      }

      if (command !== "publish_ui_test_state") {
        return undefined;
      }

      nativeStates.push(payload.state);

      if (nativeStates.length === 1) {
        await firstUpdateFinished;
      }

      return undefined;
    });

    const bridge = new TauriUiTestBridge();
    const firstPublish = bridge.publishShellState(createShellState("empty"));
    const secondPublish = bridge.publishShellState(createShellState("logs"));

    await vi.waitFor(() => expect(nativeStates).toHaveLength(1));

    releaseFirstUpdate();
    await Promise.all([firstPublish, secondPublish]);

    expect(nativeStates).toHaveLength(2);
    expect(nativeStates[0]).toContain("state=empty");
    expect(nativeStates[1]).toContain("state=logs");
  });
});

function createShellState(status: UiTestShellState["status"]): UiTestShellState {
  return {
    status,
    themeVariant: "light",
    themePreference: "light",
    platformShellVariant: "linux",
    paneCount: status === "logs" ? 1 : 0,
    paneTitles: status === "logs" ? ["app.log"] : [],
    activePaneTitle: status === "logs" ? "app.log" : null,
    synchronizationEnabled: true,
    syncVisualState: "active",
    syncPressedState: true,
    paneSearchStatus: "closed",
    paneSearchPaneTitle: null,
    timeOffsetPopoverStatus: "closed",
    timeOffsetPaneTitle: null,
    settingsSurfaceStatus: "closed",
    activePaneOffsetLabel: null,
    copiedPaneTitle: null,
    sessionSnapshotStatus: "idle",
    redesignedRegions: [],
    directoryName: null,
    directorySelectedFileTitle: null,
    directoryPreviousAvailable: false,
    directoryNextAvailable: false,
    directoryFileCount: 0,
    directoryEmptyVisible: false,
    fileLifecycleSummary: "app.log:live",
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
    darkThemeColors: { matchesAuthoritativeMockup: null, mismatchedSurfaces: [] },
    iconCentering: { allCentered: null, offCenterControls: [] },
    paneNavigation: {
      paneOrder: status === "logs" ? ["app.log"] : [],
      selectedLineNumber: null,
      maxGutterDigitCount: null,
      lastNavigation: "none",
      syncTargetLineNumber: null,
      renderedRowCount: null,
      visibleRowCount: null,
    },
    sourceOpening: {
      status: "idle",
      entryPoint: "none",
      selectedSourceKind: "none",
      openedSourceCount: 0,
      pickerRequestCount: 0,
      cancelledPickerCount: 0,
      fixtureSamplePaneCount: 0,
    },
    searchHighlights: { visible: false, count: 0 },
    copyAction: {
      visible: false,
      pointerAnchored: null,
      viewportBounded: null,
      copiedProductTextVisible: false,
    },
    timeOffsetValidation: {
      validBoundaryAccepted: false,
      invalidBoundaryRejected: false,
      blankFieldAppliesAsZero: false,
      invalidFields: [],
    },
    futureControls: {
      activityRailOpenSources: "enabled",
      activityRailSearch: "disabled",
      topbarCommandField: "disabled",
      activityRailSettings: "enabled",
    },
  };
}
