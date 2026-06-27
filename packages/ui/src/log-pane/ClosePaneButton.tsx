import React from "react";

export interface ClosePaneButtonProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly testId?: string;
}

export function ClosePaneButton({ testId, title, onClose }: ClosePaneButtonProps) {
  return (
    <button data-testid={testId} type="button" aria-label={`Close pane ${title}`} onClick={onClose}>
      x
    </button>
  );
}
