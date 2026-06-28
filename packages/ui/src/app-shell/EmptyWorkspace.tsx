import React from "react";
import { CrosslogIcon } from "./icons";
import { redesignedShellTestIds } from "./testIds";

export interface EmptyWorkspaceProps {
  readonly onOpenSource: () => void;
  readonly onFilesSelected?: React.ChangeEventHandler<HTMLInputElement>;
  readonly onDragOver?: React.DragEventHandler<HTMLElement>;
  readonly onDrop?: React.DragEventHandler<HTMLElement>;
}

export function EmptyWorkspace({
  onFilesSelected,
  onOpenSource,
  onDragOver,
  onDrop,
}: EmptyWorkspaceProps) {
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <section
      aria-label="Empty workspace"
      className="crosslog-empty-workspace"
      data-testid={redesignedShellTestIds.emptyWorkspace}
      id={redesignedShellTestIds.emptyWorkspace}
    >
      <div
        aria-label="Drop log sources"
        className="crosslog-empty-workspace__drop-zone"
        data-drag-over={dragOver ? "true" : "false"}
        data-testid={redesignedShellTestIds.emptyDropZone}
        id={redesignedShellTestIds.emptyDropZone}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(event) => {
          event.preventDefault();
          onDragOver?.(event);
        }}
        onDrop={(event) => {
          setDragOver(false);
          onDrop?.(event);
        }}
      >
        <CrosslogIcon name="drop-source" />
        <button
          className="crosslog-empty-workspace__open-source"
          data-testid={redesignedShellTestIds.emptyOpenSource}
          data-ui-test-action="openSampleLogs"
          id={redesignedShellTestIds.emptyOpenSource}
          onClick={onOpenSource}
          type="button"
        >
          Open Source
        </button>
        {onFilesSelected ? (
          <input
            aria-label="Select log source files"
            hidden
            multiple
            onChange={onFilesSelected}
            type="file"
          />
        ) : null}
      </div>
    </section>
  );
}
