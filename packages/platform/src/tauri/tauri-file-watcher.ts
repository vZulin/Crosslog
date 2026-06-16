import type { FileWatcherEvent, FileWatcherPort, FileWatcherSubscription } from "../ports/file-watcher-port";

export type TauriWatcherEventPayload =
  | { readonly kind: "appended"; readonly sourceId: string; readonly lines: readonly string[] }
  | { readonly kind: "deleted"; readonly sourceId: string }
  | {
      readonly kind: "replaced";
      readonly sourceId: string;
      readonly identity: string;
      readonly sizeBytes: number;
      readonly lines: readonly string[];
    }
  | { readonly kind: "unsupported"; readonly sourceId: string }
  | { readonly kind: "error"; readonly sourceId: string; readonly message: string };

export class TauriFileWatcher implements FileWatcherPort {
  constructor(
    private readonly subscribeToSource: (
      sourceId: string,
      onEvent: (event: TauriWatcherEventPayload) => void,
    ) => FileWatcherSubscription = createNoopSubscription,
  ) {}

  watchSource(sourceId: string, onEvent: (event: FileWatcherEvent) => void): FileWatcherSubscription {
    return this.subscribeToSource(sourceId, (event) => onEvent(mapTauriWatcherEvent(event)));
  }
}

export function mapTauriWatcherEvent(event: TauriWatcherEventPayload): FileWatcherEvent {
  switch (event.kind) {
    case "appended":
      return { type: "FileAppended", sourceId: event.sourceId, lines: event.lines };
    case "deleted":
      return { type: "FileDeleted", sourceId: event.sourceId };
    case "replaced":
      return {
        type: "FileReplaced",
        sourceId: event.sourceId,
        identity: event.identity,
        sizeBytes: event.sizeBytes,
        lines: event.lines,
      };
    case "unsupported":
      return { type: "WatcherUnsupported", sourceId: event.sourceId };
    case "error":
      return { type: "WatcherError", sourceId: event.sourceId, message: event.message };
  }
}

function createNoopSubscription(): FileWatcherSubscription {
  return {
    unsubscribe() {
      return undefined;
    },
  };
}
