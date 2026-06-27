import React from "react";
import type { Session } from "@crosslog/core";
import type { SessionStorePort } from "@crosslog/platform";

export type SessionRestoreStatus = "loading" | "ready" | "error";

export interface SessionRestoreHandlers {
  readonly onSessionRestored: (session: Session) => void;
}

export interface SessionRestoreState {
  readonly status: SessionRestoreStatus;
  readonly message: string | null;
}

export type SessionSnapshotWriteStatus = "idle" | "pending" | "written" | "error";

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
): SessionSnapshotWriteStatus {
  const [status, setStatus] = React.useState<SessionSnapshotWriteStatus>("idle");

  React.useEffect(() => {
    if (!enabled || !session) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("pending");

    sessionStore
      .writeSessionSnapshot(session)
      .then(() => {
        if (!cancelled) {
          setStatus("written");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, session, sessionStore]);

  return status;
}
