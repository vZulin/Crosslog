import React from "react";

export interface ClosePaneButtonProps {
  readonly title: string;
  readonly onClose: () => void;
}

export function ClosePaneButton({ title, onClose }: ClosePaneButtonProps) {
  return (
    <button type="button" aria-label={`Close pane ${title}`} onClick={onClose}>
      x
    </button>
  );
}
