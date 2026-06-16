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
): void {
  React.useEffect(() => {
    if (!enabled || !session) {
      return;
    }

    let cancelled = false;

    sessionStore.writeSessionSnapshot(session).catch(() => {
      if (!cancelled) {
        return;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, session, sessionStore]);
}
