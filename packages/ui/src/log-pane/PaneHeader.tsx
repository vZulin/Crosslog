import React from "react";
import type { DirectorySource } from "@crosslog/core";
import { getCurrentDirectoryFile } from "@crosslog/core";
import { ClosePaneButton } from "./ClosePaneButton";
import { DirectoryNavigator } from "./DirectoryNavigator";
import { EmptyDirectoryStatus } from "./EmptyDirectoryStatus";

export interface PaneHeaderProps {
  readonly paneId: string;
  readonly title: string;
  readonly directorySource?: DirectorySource;
  readonly onClose: () => void;
  readonly onNavigateDirectory?: (paneId: string, direction: "previous" | "next") => void;
}

export function PaneHeader({
  paneId,
  title,
  directorySource,
  onClose,
  onNavigateDirectory,
}: PaneHeaderProps) {
  const selectedFile = directorySource ? getCurrentDirectoryFile(directorySource) : null;
  const previousFile = directorySource
    ? directorySource.files.find((entry) => entry.identity.value === directorySource.navigationIndex.previousFileId) ?? null
    : null;
  const nextFile = directorySource
    ? directorySource.files.find((entry) => entry.identity.value === directorySource.navigationIndex.nextFileId) ?? null
    : null;

  return (
    <header>
      <h2>{selectedFile?.name ?? title}</h2>
      {directorySource ? (
        directorySource.files.length === 0 ? (
          <EmptyDirectoryStatus directoryName={directorySource.displayName} />
        ) : (
          <DirectoryNavigator
            directoryName={directorySource.displayName}
            selectedFileName={selectedFile?.name ?? null}
            previousFileName={previousFile?.name ?? null}
            nextFileName={nextFile?.name ?? null}
            onPrevious={() => onNavigateDirectory?.(paneId, "previous")}
            onNext={() => onNavigateDirectory?.(paneId, "next")}
          />
        )
      ) : null}
      <ClosePaneButton title={selectedFile?.name ?? title} onClose={onClose} />
    </header>
  );
}
