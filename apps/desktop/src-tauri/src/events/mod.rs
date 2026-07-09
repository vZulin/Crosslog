#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CrosslogEvent {
    FileAppended,
    FileDeleted,
    FileReplaced,
    DirectoryEntryAdded,
    DirectoryEntryRemoved,
    DirectoryEntryReplaced,
    WatcherUnsupported,
    WatcherError,
}
