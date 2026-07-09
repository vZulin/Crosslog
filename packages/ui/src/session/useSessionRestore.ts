import React from "react";
import type { Session } from "@crosslog/core";
import type { SessionStorePort } from "@crosslog/platform";

export type SessionRestoreStatus = "loading" | "ready" | "error";

export interface SessionRestoreHandlers {
  readonly onSessionRestored: (session: Session) => void;
  readonly onSessionRestoreFailed?: (error: unknown) => void;
}

export interface SessionRestoreState {
  readonly status: SessionRestoreStatus;
  readonly message: string | null;
}

export type SessionSnapshotWriteStatus = "idle" | "pending" | "written" | "error";

interface SessionSnapshotWriteState {
  readonly status: SessionSnapshotWriteStatus;
  readonly session: Session | null;
}

export function useSessionRestore(
  sessionStore: SessionStorePort,
  handlers: SessionRestoreHandlers,
): SessionRestoreState {
  const handlersRef = React.useRef(handlers);
  const [state, setState] = React.useState<SessionRestoreState>({
    status: "loading",
    message: null,
  });

  React.useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  React.useEffect(() => {
    let active = true;

    sessionStore
      .recoverSession()
      .then((session) => {
        if (!active) {
          return;
        }

        if (session) {
          handlersRef.current.onSessionRestored(session);
        }

        setState({ status: "ready", message: null });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        handlersRef.current.onSessionRestoreFailed?.(error);
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Session recovery failed.",
        });
      });

    return () => {
      active = false;
    };
  }, [sessionStore]);

  return state;
}

export function useSessionSnapshotWriter(
  sessionStore: SessionStorePort,
  session: Session | null,
  enabled: boolean,
  onSnapshotWriteFailed?: (error: unknown, session: Session) => void,
): SessionSnapshotWriteStatus {
  const [writeState, setWriteState] = React.useState<SessionSnapshotWriteState>({
    status: "idle",
    session: null,
  });

  React.useEffect(() => {
    if (!enabled || !session) {
      setWriteState({ status: "idle", session: null });
      return;
    }

    let cancelled = false;
    setWriteState({ status: "pending", session });

    sessionStore
      .writeSessionSnapshot(session)
      .then(() => {
        if (!cancelled) {
          setWriteState({ status: "written", session });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          onSnapshotWriteFailed?.(error, session);
          setWriteState({ status: "error", session });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, onSnapshotWriteFailed, session, sessionStore]);

  if (!enabled || !session) {
    return "idle";
  }

  return writeState.session === session ? writeState.status : "pending";
}
