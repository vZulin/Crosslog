import React from "react";
import type { DirectorySource } from "@crosslog/core";
import { getCurrentDirectoryFile } from "@crosslog/core";
import { ClosePaneButton } from "./ClosePaneButton";
import { DirectoryNavigator } from "./DirectoryNavigator";
import { EmptyDirectoryStatus } from "./EmptyDirectoryStatus";
import { redesignedShellTestIds } from "../app-shell/testIds";

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
  const displayTitle = selectedFile?.name ?? title;

  return (
    <header
      className="crosslog-pane-header"
      data-testid={redesignedShellTestIds.paneHeader}
      id={redesignedShellTestIds.paneHeader}
    >
      <div className="crosslog-pane-header__identity">
        <h2 className="crosslog-pane-header__title" title={displayTitle}>
          {displayTitle}
        </h2>
        {directorySource ? (
          <span className="crosslog-pane-header__directory" title={directorySource.displayName}>
            {directorySource.displayName}
          </span>
        ) : null}
      </div>
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
      <ClosePaneButton
        testId={redesignedShellTestIds.paneHeaderClose}
        title={displayTitle}
        onClose={onClose}
      />
    </header>
  );
}
