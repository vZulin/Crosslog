import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendRawLinesToChunks, type FileSource } from "@crosslog/core";
import type {
  CrosslogPlatform,
  DiagnosticLogEvent,
  DiagnosticLogPort,
  FileSourceRef,
  SessionStorePort,
} from "@crosslog/platform";
import { AppShell } from "../../src/app-shell/AppShell";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";
import { usePaneSearchStore } from "../../src/search/usePaneSearchStore";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("AppShell diagnostic logging", () => {
  beforeEach(() => {
    usePaneSearchStore.getState().reset();
    useSynchronizationStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs desktop pane open, focus, and close lifecycle events", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    const platform = createMockPlatform({
      diagnosticLogger,
      selectedFileBatches: [
        [{ id: "source-app", name: "app.log", path: "/logs/app.log" }],
        [{ id: "source-service", name: "service.log", path: "/logs/service.log" }],
      ],
    });
    const { getByRole, getByTestId, queryByRole } = render(<AppShell platform={platform} />);

    await settleShellEffects();
    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getByRole("heading", { name: "app.log" })).toBeTruthy());

    fireEvent.click(getByTestId(redesignedShellTestIds.topbarAddFile));
    await waitFor(() => expect(getByRole("heading", { name: "service.log" })).toBeTruthy());

    fireEvent.click(getByRole("heading", { name: "app.log" }));
    await waitFor(() =>
      expect(findDiagnosticEvent(diagnosticLogger, "desktop.pane.focus_changed")).toBeTruthy(),
    );

    fireEvent.click(getByRole("button", { name: "Close pane app.log" }));
    await waitFor(() => expect(queryByRole("heading", { name: "app.log" })).toBeNull());

    expect(
      findDiagnosticEvent(diagnosticLogger, "desktop.pane.opened", (event) => event.fields?.path === "/logs/app.log"),
    ).toMatchObject({
      fields: {
        activePaneCountAfter: 1,
        lineCount: 2,
        paneId: "pane-1",
        path: "/logs/app.log",
        sourceKind: "file",
      },
    });
    expect(
      findDiagnosticEvent(
        diagnosticLogger,
        "desktop.pane.opened",
        (event) => event.fields?.path === "/logs/service.log",
      ),
    ).toMatchObject({
      fields: {
        activePaneCountAfter: 2,
        paneId: "pane-2",
      },
    });
    expect(findDiagnosticEvent(diagnosticLogger, "desktop.pane.focus_changed")).toMatchObject({
      fields: {
        paneId: "pane-1",
        path: "/logs/app.log",
        previousPaneId: "pane-2",
        previousPath: "/logs/service.log",
      },
    });
    expect(
      findDiagnosticEvent(diagnosticLogger, "desktop.pane.closed", (event) => event.fields?.paneId === "pane-1"),
    ).toMatchObject({
      fields: {
        activePaneCountAfter: 1,
        path: "/logs/app.log",
      },
    });
  });

  it("logs unhandled UI errors for desktop diagnostics", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    render(<AppShell platform={createMockPlatform({ diagnosticLogger })} />);
    await settleShellEffects();
    diagnosticLogger.write.mockClear();

    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "Root shell crashed",
        filename: "AppShell.tsx",
        lineno: 42,
        colno: 7,
        error: new Error("Root shell crashed"),
      }),
    );

    await waitFor(() =>
      expect(findDiagnosticEvent(diagnosticLogger, "desktop.ui.unhandled_error")).toMatchObject({
        fields: {
          browserMessage: "Root shell crashed",
          columnNumber: 7,
          lineNumber: 42,
          message: "Root shell crashed",
          source: "AppShell.tsx",
        },
      }),
    );
  });

  it("samples synchronized navigation once every five seconds", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    let now = 10_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const platform = createMockPlatform({
      diagnosticLogger,
      selectedFileBatches: [
        [
          { id: "source-app", name: "app.log", path: "/logs/app.log" },
          { id: "source-service", name: "service.log", path: "/logs/service.log" },
        ],
      ],
      sourceLinesById: {
        "source-app": [
          "2026-06-16T09:00:00.000Z app first",
          "2026-06-16T09:00:01.000Z app second",
          "2026-06-16T09:00:02.000Z app third",
          "2026-06-16T09:00:03.000Z app fourth",
        ],
        "source-service": [
          "2026-06-16T09:00:00.000Z service first",
          "2026-06-16T09:00:01.000Z service second",
          "2026-06-16T09:00:02.000Z service third",
          "2026-06-16T09:00:03.000Z service fourth",
        ],
      },
    });
    const { container, getByRole } = render(<AppShell platform={platform} />);

    await settleShellEffects();
    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getByRole("heading", { name: "service.log" })).toBeTruthy());
    diagnosticLogger.write.mockClear();

    fireEvent.click(getPaneRow(container, "pane-1", 2));
    await waitFor(() => expect(findAllDiagnosticEvents(diagnosticLogger, "desktop.sync.navigation_sampled")).toHaveLength(1));

    now += 1_000;
    fireEvent.click(getPaneRow(container, "pane-1", 3));
    await settleShellEffects();
    expect(findAllDiagnosticEvents(diagnosticLogger, "desktop.sync.navigation_sampled")).toHaveLength(1);

    now += 5_000;
    fireEvent.click(getPaneRow(container, "pane-1", 4));
    await waitFor(() => expect(findAllDiagnosticEvents(diagnosticLogger, "desktop.sync.navigation_sampled")).toHaveLength(2));

    expect(findAllDiagnosticEvents(diagnosticLogger, "desktop.sync.navigation_sampled")[0]).toMatchObject({
      fields: {
        anchorLineNumber: 2,
        anchorPaneId: "pane-1",
        anchorTimestamp: "2026-06-16T09:00:01.000Z",
        navigationKind: "click",
        panes: [
          {
            lineNumber: 2,
            paneId: "pane-1",
            role: "anchor",
            screenRow: 2,
            timestamp: "2026-06-16T09:00:01.000Z",
            timeOffsetMilliseconds: 0,
          },
          {
            lineNumber: 2,
            paneId: "pane-2",
            role: "target",
            screenRow: 2,
            timestamp: "2026-06-16T09:00:01.000Z",
            timeOffsetMilliseconds: 0,
          },
        ],
      },
    });
  });

  it("logs source open policy decisions and duration", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    const platform = createMockPlatform({
      diagnosticLogger,
      selectedFileBatches: [[{ id: "source-huge", name: "huge.log", path: "/logs/huge.log" }]],
      openFileReadOnly: vi.fn(async () => ({
        ok: false as const,
        error: {
          code: "FileTooLarge" as const,
          message: "File size exceeds configured maximum.",
        },
      })),
    });
    const { getByRole } = render(<AppShell platform={platform} />);

    await settleShellEffects();
    fireEvent.click(getByRole("button", { name: "Open File" }));

    await waitFor(() =>
      expect(findDiagnosticEvent(diagnosticLogger, "desktop.source.open_policy_decision")).toMatchObject({
        fields: {
          decision: "rejected",
          errorCode: "FileTooLarge",
          path: "/logs/huge.log",
          sourceKind: "file",
          title: "huge.log",
        },
      }),
    );
    expect(findDiagnosticEvent(diagnosticLogger, "desktop.source.open_failed")).toMatchObject({
      fields: {
        errorCode: "FileTooLarge",
        openDurationMs: expect.any(Number),
      },
    });
  });

  it("logs successful large source open completion with duration", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    const sourceRef: FileSourceRef = { id: "source-huge", name: "huge.log", path: "/logs/huge.log" };
    const largeSource = {
      ...createTestFileSource(sourceRef, [
        "2026-06-16T09:00:00.000Z huge first",
        "2026-06-16T09:00:01.000Z huge second",
      ]),
      sizeBytes: 5 * 1024 * 1024,
    };
    const platform = createMockPlatform({
      diagnosticLogger,
      selectedFileBatches: [[sourceRef]],
      openFileReadOnly: vi.fn(async () => ({
        ok: true as const,
        source: largeSource,
      })),
    });
    const { getByRole } = render(<AppShell platform={platform} />);

    await settleShellEffects();
    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getByRole("heading", { name: "huge.log" })).toBeTruthy());

    expect(findDiagnosticEvent(diagnosticLogger, "desktop.source.open_policy_decision")).toMatchObject({
      fields: {
        decision: "accepted",
        openDurationMs: expect.any(Number),
        path: "/logs/huge.log",
        sizeBytes: 5 * 1024 * 1024,
        sourceKind: "file",
        title: "huge.log",
      },
    });
    expect(findDiagnosticEvent(diagnosticLogger, "desktop.source.large_open_completed")).toMatchObject({
      fields: {
        lineCount: 2,
        openDurationMs: expect.any(Number),
        path: "/logs/huge.log",
        sizeBytes: 5 * 1024 * 1024,
        sourceKind: "file",
        title: "huge.log",
      },
    });
  });

  it("logs session restore and snapshot write failures", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    const restoreFailurePlatform = createMockPlatform({
      diagnosticLogger,
      sessionStore: {
        loadLastValidSession: vi.fn(async () => null),
        recoverSession: vi.fn(async () => {
          throw new Error("restore failed");
        }),
        writeSessionSnapshot: vi.fn(async () => undefined),
      },
    });

    const restoreFailureRender = render(<AppShell platform={restoreFailurePlatform} />);
    await waitFor(() =>
      expect(findDiagnosticEvent(diagnosticLogger, "desktop.session.restore_failed")).toMatchObject({
        fields: {
          message: "restore failed",
        },
      }),
    );
    restoreFailureRender.unmount();

    diagnosticLogger.write.mockClear();
    const writeFailurePlatform = createMockPlatform({
      diagnosticLogger,
      selectedFileBatches: [[{ id: "source-app", name: "app.log", path: "/logs/app.log" }]],
      sessionStore: {
        loadLastValidSession: vi.fn(async () => null),
        recoverSession: vi.fn(async () => null),
        writeSessionSnapshot: vi.fn(async () => {
          throw new Error("snapshot failed");
        }),
      },
    });
    const { getByRole } = render(<AppShell platform={writeFailurePlatform} />);

    await settleShellEffects();
    fireEvent.click(getByRole("button", { name: "Open File" }));

    await waitFor(() =>
      expect(findDiagnosticEvent(diagnosticLogger, "desktop.session.snapshot_write_failed")).toMatchObject({
        fields: {
          message: "snapshot failed",
          paneCount: 1,
          sourceCount: expect.any(Number),
        },
      }),
    );
  });

  it("logs a blank shell health check when pane state exists but the workspace disappears", async () => {
    const diagnosticLogger = createDiagnosticLogger();
    const intervalCallbacks: Array<() => void> = [];
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval").mockImplementation((handler, ...args) => {
      void args;

      if (typeof handler === "function") {
        intervalCallbacks.push(() => handler());
      }

      return 1 as unknown as ReturnType<typeof globalThis.setInterval>;
    });
    const platform = createMockPlatform({
      diagnosticLogger,
      selectedFileBatches: [[{ id: "source-app", name: "app.log", path: "/logs/app.log" }]],
    });
    const { container, getByRole } = render(<AppShell platform={platform} />);

    await settleShellEffects();
    setIntervalSpy.mockRestore();
    fireEvent.click(getByRole("button", { name: "Open File" }));
    await waitFor(() => expect(getByRole("heading", { name: "app.log" })).toBeTruthy());
    diagnosticLogger.write.mockClear();

    container.querySelector<HTMLElement>(`[data-testid="${redesignedShellTestIds.paneWorkspace}"]`)?.remove();
    act(() => {
      intervalCallbacks.forEach((callback) => callback());
    });

    expect(findDiagnosticEvent(diagnosticLogger, "desktop.ui.blank_shell_detected")).toMatchObject({
      fields: {
        actualPaneCount: 0,
        expectedPaneCount: 1,
        shellPresent: true,
        workspacePresent: false,
      },
    });
  });
});

function createDiagnosticLogger() {
  return {
    write: vi.fn(async (event: DiagnosticLogEvent) => {
      void event;
    }),
  };
}

function getPaneRow(container: HTMLElement, paneId: string, lineNumber: number): HTMLElement {
  const pane = container.querySelector<HTMLElement>(
    `[data-testid="log-pane"][data-pane-id="${paneId}"]`,
  );
  const row = pane?.querySelector<HTMLElement>(`[data-line-number="${lineNumber}"]`);

  if (!row) {
    throw new Error(`Missing row ${lineNumber} in ${paneId}`);
  }

  return row;
}

async function settleShellEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

interface MockPlatformOptions {
  readonly diagnosticLogger?: DiagnosticLogPort;
  readonly openFileReadOnly?: CrosslogPlatform["fileAccess"]["openFileReadOnly"];
  readonly selectedFileBatches?: readonly (readonly FileSourceRef[])[];
  readonly sessionStore?: SessionStorePort;
  readonly sourceLinesById?: Readonly<Record<string, readonly string[]>>;
}

function createMockPlatform(options: MockPlatformOptions = {}): CrosslogPlatform {
  const selectedFileBatches = [...(options.selectedFileBatches ?? [])];

  return {
    kind: "desktop",
    capabilities: {
      canOpenFiles: true,
      canOpenDirectories: true,
      canWatchFiles: false,
      canDiscoverNewDirectoryFiles: false,
      canPersistSession: true,
      limitations: [],
    },
    fileAccess: {
      openFileReadOnly: options.openFileReadOnly ?? vi.fn(async (sourceRef) => ({
        ok: true,
        source: createTestFileSource(sourceRef, options.sourceLinesById?.[sourceRef.id]),
      })),
      decodeFile: vi.fn(async () => ""),
      getFileIdentity: vi.fn(async (sourceRef) => sourceRef.path ?? sourceRef.id),
    },
    directoryAccess: {
      listTopLevelFiles: vi.fn(async () => []),
      refreshDirectory: vi.fn(async () => []),
    },
    dragDropSource: {
      mapDroppedSources: vi.fn(async () => []),
    },
    sourcePicker: {
      pickFiles: vi.fn(async () => selectedFileBatches.shift() ?? []),
      pickDirectory: vi.fn(async () => null),
    },
    sessionStore: options.sessionStore ?? {
      loadLastValidSession: vi.fn(async () => null),
      writeSessionSnapshot: vi.fn(async () => undefined),
      recoverSession: vi.fn(async () => null),
    },
    diagnosticLogger: options.diagnosticLogger,
  };
}

function createTestFileSource(sourceRef: FileSourceRef, sourceLines?: readonly string[]): FileSource {
  const lines = sourceLines ?? [`${sourceRef.name} first line`, `${sourceRef.name} second line`];
  const path = sourceRef.path ?? sourceRef.id;

  return {
    id: sourceRef.id,
    fileIdentity: { value: path, platform: "desktop" },
    displayName: sourceRef.name,
    pathLabel: path,
    sizeBytes: lines.join("\n").length,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], lines),
    watchState: "watching",
    deleted: false,
    replaced: false,
    readError: null,
  };
}

function findDiagnosticEvent(
  logger: ReturnType<typeof createDiagnosticLogger>,
  name: string,
  predicate: (event: DiagnosticLogEvent) => boolean = () => true,
): DiagnosticLogEvent | undefined {
  return logger.write.mock.calls.map(([event]) => event).find((event) => event.name === name && predicate(event));
}

function findAllDiagnosticEvents(
  logger: ReturnType<typeof createDiagnosticLogger>,
  name: string,
): readonly DiagnosticLogEvent[] {
  return logger.write.mock.calls.map(([event]) => event).filter((event) => event.name === name);
}
