import React from "react";

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
  return (
    <div aria-label={`Directory navigation for ${directoryName}`}>
      <p>
        <span>{directoryName}</span>
        {selectedFileName ? <span> / {selectedFileName}</span> : null}
      </p>
      <button
        type="button"
        aria-label={`Previous file in ${directoryName}`}
        disabled={!previousFileName}
        onClick={onPrevious}
      >
        Previous
      </button>
      <button
        type="button"
        aria-label={`Next file in ${directoryName}`}
        disabled={!nextFileName}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  );
}
