import React from "react";
import { CrosslogIcon } from "../app-shell/icons";

export interface ClosePaneButtonProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly className?: string;
  readonly testId?: string;
}

export function ClosePaneButton({ className, testId, title, onClose }: ClosePaneButtonProps) {
  return (
    <button
      aria-label={`Close pane ${title}`}
      className={className}
      data-testid={testId}
      onClick={onClose}
      title={`Close ${title}`}
      type="button"
    >
      <CrosslogIcon name="close" />
    </button>
  );
}
