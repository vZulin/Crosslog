import type { DirectoryFileEntry } from "./directory-file-entry";
import { getDirectoryFileEntryId, sortDirectoryFileEntries } from "./directory-file-entry";

export interface NavigationIndex {
  readonly orderedFileIds: readonly string[];
  readonly currentFileId: string | null;
  readonly previousFileId: string | null;
  readonly nextFileId: string | null;
}

export type NavigationDirection = "previous" | "next";

export function createNavigationIndex(
  entries: readonly DirectoryFileEntry[],
  requestedCurrentFileId: string | null = null,
): NavigationIndex {
  const orderedFileIds = sortDirectoryFileEntries(entries).map(getDirectoryFileEntryId);
  const currentFileId =
    requestedCurrentFileId && orderedFileIds.includes(requestedCurrentFileId)
      ? requestedCurrentFileId
      : orderedFileIds[0] ?? null;

  return buildNavigationIndex(orderedFileIds, currentFileId);
}

export function refreshNavigationIndex(
  entries: readonly DirectoryFileEntry[],
  previousCurrentFileId: string | null,
): NavigationIndex {
  return createNavigationIndex(entries, previousCurrentFileId);
}

export function selectNavigationFile(index: NavigationIndex, fileId: string | null): NavigationIndex {
  if (!fileId || !index.orderedFileIds.includes(fileId)) {
    return index;
  }

  return buildNavigationIndex(index.orderedFileIds, fileId);
}

export function moveNavigation(index: NavigationIndex, direction: NavigationDirection): NavigationIndex {
  const targetFileId = direction === "previous" ? index.previousFileId : index.nextFileId;

  return targetFileId ? selectNavigationFile(index, targetFileId) : index;
}

function buildNavigationIndex(orderedFileIds: readonly string[], currentFileId: string | null): NavigationIndex {
  const currentIndex = currentFileId ? orderedFileIds.indexOf(currentFileId) : -1;

  if (currentIndex < 0) {
    return {
      orderedFileIds,
      currentFileId: null,
      previousFileId: null,
      nextFileId: null,
    };
  }

  return {
    orderedFileIds,
    currentFileId,
    previousFileId: orderedFileIds[currentIndex - 1] ?? null,
    nextFileId: orderedFileIds[currentIndex + 1] ?? null,
  };
}
