import React from "react";

export interface DeletedFileStatusProps {
  readonly title: string;
}

export function DeletedFileStatus({ title }: DeletedFileStatusProps) {
  return (
    <p role="status" aria-live="polite">
      {title} was deleted. Loaded content is retained.
    </p>
  );
}
