export type FileWatcherEvent =
  | { readonly type: "FileAppended"; readonly sourceId: string; readonly lines?: readonly string[] }
  | { readonly type: "FileDeleted"; readonly sourceId: string }
  | {
      readonly type: "FileReplaced";
      readonly sourceId: string;
      readonly identity?: string;
      readonly sizeBytes?: number;
      readonly lines?: readonly string[];
    }
  | { readonly type: "DirectoryEntryAdded"; readonly directoryId: string }
  | { readonly type: "DirectoryEntryRemoved"; readonly directoryId: string }
  | { readonly type: "DirectoryEntryReplaced"; readonly directoryId: string }
  | { readonly type: "WatcherUnsupported"; readonly sourceId: string }
  | { readonly type: "WatcherError"; readonly sourceId: string; readonly message: string };

export interface FileWatcherSubscription {
  unsubscribe(): void;
}

export interface FileWatcherPort {
  watchSource(
    sourceId: string,
    onEvent: (event: FileWatcherEvent) => void,
  ): FileWatcherSubscription;
}
