import React from "react";
import { CrosslogIcon } from "./icons";
import { redesignedShellTestIds } from "./testIds";

export interface EmptyWorkspaceProps {
  readonly onOpenSource: () => void;
  readonly onDragOver?: React.DragEventHandler<HTMLElement>;
  readonly onDrop?: React.DragEventHandler<HTMLElement>;
  /**
   * When true (Web), the workspace offers explicit Open File and Open Directory
   * actions instead of the single Open Source action. Each action opens the
   * matching picker within its own user gesture so directory selection is
   * reachable in the browser.
   */
  readonly showSourceKindOptions?: boolean;
  readonly onOpenFile?: () => void;
  readonly onOpenDirectory?: () => void;
}

export function EmptyWorkspace({
  onOpenSource,
  onDragOver,
  onDrop,
  showSourceKindOptions = false,
  onOpenFile,
  onOpenDirectory,
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
        {showSourceKindOptions ? (
          <div className="crosslog-empty-workspace__open-actions">
            <button
              className="crosslog-empty-workspace__open-source"
              data-testid={redesignedShellTestIds.emptyOpenFile}
              id={redesignedShellTestIds.emptyOpenFile}
              onClick={onOpenFile}
              type="button"
            >
              <CrosslogIcon name="file" />
              <span>Open File</span>
            </button>
            <button
              className="crosslog-empty-workspace__open-source"
              data-testid={redesignedShellTestIds.emptyOpenDirectory}
              id={redesignedShellTestIds.emptyOpenDirectory}
              onClick={onOpenDirectory}
              type="button"
            >
              <CrosslogIcon name="folder" />
              <span>Open Directory</span>
            </button>
          </div>
        ) : (
          <button
            className="crosslog-empty-workspace__open-source"
            data-testid={redesignedShellTestIds.emptyOpenSource}
            id={redesignedShellTestIds.emptyOpenSource}
            onClick={onOpenSource}
            type="button"
          >
            Open Source
          </button>
        )}
      </div>
    </section>
  );
}
