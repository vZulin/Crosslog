import React from "react";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface DeletedFileStatusProps {
  readonly title: string;
}

export function DeletedFileStatus({ title }: DeletedFileStatusProps) {
  return (
    <p
      aria-label={`Deleted file ${title}, loaded content retained`}
      aria-live="polite"
      className="crosslog-pane-deleted-status"
      data-testid={redesignedShellTestIds.paneDeletedStatus}
      role="status"
    >
      {title} was deleted. Loaded content is retained.
    </p>
  );
}
