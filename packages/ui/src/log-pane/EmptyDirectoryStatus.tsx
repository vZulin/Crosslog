import React from "react";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface EmptyDirectoryStatusProps {
  readonly directoryName: string;
}

export function EmptyDirectoryStatus({ directoryName }: EmptyDirectoryStatusProps) {
  return (
    <p
      className="crosslog-empty-directory-status"
      role="status"
      aria-label={`Empty directory ${directoryName}`}
      data-testid={redesignedShellTestIds.paneHeaderEmptyDirectory}
      title={`No top-level log files in ${directoryName}`}
    >
      No top-level log files in {directoryName}
    </p>
  );
}
