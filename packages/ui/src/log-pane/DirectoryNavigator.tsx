import React from "react";
import { IconButton } from "../app-shell/IconButton";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface DirectoryNavigatorProps {
  readonly directoryName: string;
  readonly selectedFileName: string | null;
  readonly previousFileName: string | null;
  readonly nextFileName: string | null;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

export function DirectoryNavigator({
  directoryName,
  selectedFileName,
  previousFileName,
  nextFileName,
  onPrevious,
  onNext,
}: DirectoryNavigatorProps) {
  const navigationLabel = selectedFileName
    ? `Directory navigation for ${selectedFileName} in ${directoryName}`
    : `Directory navigation for ${directoryName}`;

  return (
    <div className="crosslog-directory-navigator" aria-label={navigationLabel}>
      <IconButton
        disabled={!previousFileName}
        icon="previous"
        label={`Previous file in ${directoryName}`}
        onClick={onPrevious}
        testId={redesignedShellTestIds.paneHeaderDirectoryPrevious}
        tooltip={previousFileName ? `Previous file: ${previousFileName}` : `No previous file in ${directoryName}`}
      />
      <IconButton
        disabled={!nextFileName}
        icon="next"
        label={`Next file in ${directoryName}`}
        onClick={onNext}
        testId={redesignedShellTestIds.paneHeaderDirectoryNext}
        tooltip={nextFileName ? `Next file: ${nextFileName}` : `No next file in ${directoryName}`}
      />
    </div>
  );
}
