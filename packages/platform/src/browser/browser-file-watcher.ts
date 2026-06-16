import type { FileWatcherEvent, FileWatcherPort, FileWatcherSubscription } from "../ports/file-watcher-port";

export class BrowserFileWatcher implements FileWatcherPort {
  watchSource(sourceId: string, onEvent: (event: FileWatcherEvent) => void): FileWatcherSubscription {
    onEvent({ type: "WatcherUnsupported", sourceId });

    return {
      unsubscribe() {
        return undefined;
      },
    };
  }
}
