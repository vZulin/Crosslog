import React from "react";

export interface EmptyDirectoryStatusProps {
  readonly directoryName: string;
}

export function EmptyDirectoryStatus({ directoryName }: EmptyDirectoryStatusProps) {
  return (
    <p role="status" aria-label={`Empty directory ${directoryName}`}>
      No top-level log files in {directoryName}
    </p>
  );
}
