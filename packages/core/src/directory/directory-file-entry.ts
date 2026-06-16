import type { FileIdentity } from "../file-source/file-source";

export interface DirectoryFileEntry {
  readonly identity: FileIdentity;
  readonly name: string;
  readonly createdAt: Date | null;
  readonly fallbackOrderKey: string;
  readonly sizeBytes: number;
}

export interface DirectoryFileEntryInput {
  readonly identity: FileIdentity;
  readonly name: string;
  readonly createdAt?: Date | null;
  readonly fallbackOrderKey?: string;
  readonly sizeBytes?: number;
}

export function createDirectoryFileEntry(input: DirectoryFileEntryInput): DirectoryFileEntry {
  return {
    identity: input.identity,
    name: input.name,
    createdAt: input.createdAt ?? null,
    fallbackOrderKey: input.fallbackOrderKey ?? input.name,
    sizeBytes: Math.max(0, input.sizeBytes ?? 0),
  };
}

export function getDirectoryFileEntryId(entry: DirectoryFileEntry): string {
  return entry.identity.value;
}

export function compareDirectoryFileEntries(left: DirectoryFileEntry, right: DirectoryFileEntry): number {
  const leftCreatedAt = left.createdAt?.getTime() ?? null;
  const rightCreatedAt = right.createdAt?.getTime() ?? null;

  if (leftCreatedAt !== null && rightCreatedAt !== null && leftCreatedAt !== rightCreatedAt) {
    return rightCreatedAt - leftCreatedAt;
  }

  const fallbackOrder = right.fallbackOrderKey.localeCompare(left.fallbackOrderKey, undefined, {
    numeric: true,
    sensitivity: "base",
  });

  if (fallbackOrder !== 0) {
    return fallbackOrder;
  }

  const nameOrder = right.name.localeCompare(left.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });

  if (nameOrder !== 0) {
    return nameOrder;
  }

  return right.identity.value.localeCompare(left.identity.value, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortDirectoryFileEntries(
  entries: readonly DirectoryFileEntry[],
): readonly DirectoryFileEntry[] {
  return [...entries].sort(compareDirectoryFileEntries);
}
