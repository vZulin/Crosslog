import React from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "@crosslog/core";
import type { SessionStorePort } from "@crosslog/platform";
import {
  useSessionSnapshotWriter,
  type SessionSnapshotWriteStatus,
} from "../../src/session/useSessionRestore";

describe("session restore hooks", () => {
  it("reports pending while the current snapshot write has not finished", async () => {
    const firstWrite = createDeferred<void>();
    const secondWrite = createDeferred<void>();
    const renderedStatuses: SessionSnapshotWriteStatus[] = [];
    const sessionStore = createSessionStore({
      writeSessionSnapshot: vi
        .fn()
        .mockReturnValueOnce(firstWrite.promise)
        .mockReturnValueOnce(secondWrite.promise),
    });
    const firstSession = createValidSession("pane-first");
    const secondSession = createValidSession("pane-second");

    const { rerender } = render(
      <SessionSnapshotWriterProbe
        enabled
        onRenderStatus={(status) => renderedStatuses.push(status)}
        session={firstSession}
        sessionStore={sessionStore}
      />,
    );

    expect(screen.getByLabelText("snapshot status").textContent).toBe("pending");

    await act(async () => {
      firstWrite.resolve();
      await firstWrite.promise;
    });

    expect(screen.getByLabelText("snapshot status").textContent).toBe("written");

    const statusCountBeforeSecondSession = renderedStatuses.length;
    rerender(
      <SessionSnapshotWriterProbe
        enabled
        onRenderStatus={(status) => renderedStatuses.push(status)}
        session={secondSession}
        sessionStore={sessionStore}
      />,
    );

    expect(renderedStatuses.slice(statusCountBeforeSecondSession)).not.toContain("written");
    expect(screen.getByLabelText("snapshot status").textContent).toBe("pending");

    await act(async () => {
      secondWrite.resolve();
      await secondWrite.promise;
    });

    expect(screen.getByLabelText("snapshot status").textContent).toBe("written");
  });
});

interface SessionSnapshotWriterProbeProps {
  readonly enabled: boolean;
  readonly onRenderStatus: (status: SessionSnapshotWriteStatus) => void;
  readonly session: Session | null;
  readonly sessionStore: SessionStorePort;
}

function SessionSnapshotWriterProbe({
  enabled,
  onRenderStatus,
  session,
  sessionStore,
}: SessionSnapshotWriterProbeProps) {
  const status = useSessionSnapshotWriter(sessionStore, session, enabled);
  onRenderStatus(status);

  return <output aria-label="snapshot status">{status}</output>;
}

function createSessionStore(
  overrides: Partial<SessionStorePort> = {},
): SessionStorePort {
  return {
    loadLastValidSession: vi.fn().mockResolvedValue(null),
    recoverSession: vi.fn().mockResolvedValue(null),
    writeSessionSnapshot: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function createValidSession(paneId: string): Session {
  return {
    schemaVersion: 1,
    panes: [
      {
        id: paneId,
        sourceRef: "source-app",
        title: "app.log",
        active: true,
        width: 520,
        timeOffset: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        },
      },
    ],
    paneSizes: { [paneId]: 520 },
    sources: [
      {
        kind: "file",
        id: "source-app",
        fileIdentity: { value: "source-app", platform: "desktop" },
        displayName: "app.log",
        pathLabel: "app.log",
        sizeBytes: 120,
        encoding: "utf-8",
      },
    ],
    directorySelections: {},
    synchronizationEnabled: true,
    futureExtensions: {},
  };
}
