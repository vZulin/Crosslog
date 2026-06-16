import type { DirectoryIdentity, DirectorySource, DirectorySourceId } from "./directory-source";
import type { DirectoryFileEntry } from "./directory-file-entry";
import { getDirectoryFileEntryId, sortDirectoryFileEntries } from "./directory-file-entry";
import { createNavigationIndex, moveNavigation, refreshNavigationIndex, selectNavigationFile } from "./navigation-index";

export interface DirectorySourceInput {
  readonly id: DirectorySourceId;
  readonly directoryIdentity: DirectoryIdentity;
  readonly displayName: string;
  readonly files?: readonly DirectoryFileEntry[];
  readonly currentFileId?: string | null;
  readonly watchState?: DirectorySource["watchState"];
}

export type DirectorySourceAction =
  | { readonly type: "selectFile"; readonly fileId: string }
  | { readonly type: "navigate"; readonly direction: "previous" | "next" }
  | { readonly type: "refreshFiles"; readonly files: readonly DirectoryFileEntry[] }
  | { readonly type: "setWatchState"; readonly watchState: DirectorySource["watchState"] };

export function createDirectorySource(input: DirectorySourceInput): DirectorySource {
  const files = sortDirectoryFileEntries(input.files ?? []);
  const navigationIndex = createNavigationIndex(files, input.currentFileId ?? null);

  return {
    id: input.id,
    directoryIdentity: input.directoryIdentity,
    displayName: input.displayName,
    files,
    currentFileId: navigationIndex.currentFileId,
    navigationIndex,
    watchState: input.watchState ?? "unsupported",
  };
}

export function directorySourceReducer(
  source: DirectorySource,
  action: DirectorySourceAction,
): DirectorySource {
  switch (action.type) {
    case "selectFile": {
      const navigationIndex = selectNavigationFile(source.navigationIndex, action.fileId);

      return {
        ...source,
        currentFileId: navigationIndex.currentFileId,
        navigationIndex,
      };
    }

    case "navigate": {
      const navigationIndex = moveNavigation(source.navigationIndex, action.direction);

      return {
        ...source,
        currentFileId: navigationIndex.currentFileId,
        navigationIndex,
      };
    }

    case "refreshFiles": {
      const files = sortDirectoryFileEntries(action.files);
      const previousCurrentFileId = source.currentFileId;
      const navigationIndex = refreshNavigationIndex(files, previousCurrentFileId);
      const currentFileId = files.some((entry) => getDirectoryFileEntryId(entry) === previousCurrentFileId)
        ? previousCurrentFileId
        : navigationIndex.currentFileId;

      return {
        ...source,
        files,
        currentFileId,
        navigationIndex: currentFileId === navigationIndex.currentFileId
          ? navigationIndex
          : selectNavigationFile(navigationIndex, currentFileId),
      };
    }

    case "setWatchState":
      return {
        ...source,
        watchState: action.watchState,
      };
  }
}

export function getCurrentDirectoryFile(source: DirectorySource): DirectoryFileEntry | null {
  return source.files.find((entry) => getDirectoryFileEntryId(entry) === source.currentFileId) ?? null;
}
