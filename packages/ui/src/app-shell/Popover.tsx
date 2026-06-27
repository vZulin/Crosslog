import React from "react";

export type PopoverPlacement = "block-end" | "block-start" | "inline-end" | "inline-start";

export interface PopoverProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly ownerLabel?: string;
  readonly placement?: PopoverPlacement;
  readonly testId?: string;
  readonly onEscapeKeyDown?: () => void;
}

export function Popover({
  children,
  className,
  label,
  ownerLabel,
  placement = "block-end",
  testId,
  onEscapeKeyDown,
  onKeyDown,
  ...sectionProps
}: PopoverProps) {
  const classes = ["crosslog-popover", className].filter(Boolean).join(" ");
  const accessibleLabel = ownerLabel ? `${label} for ${ownerLabel}` : label;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      onEscapeKeyDown?.();
    }

    onKeyDown?.(event);
  };

  return (
    <section
      aria-label={accessibleLabel}
      className={classes}
      data-placement={placement}
      data-testid={testId}
      role="dialog"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      {...sectionProps}
    >
      {children}
    </section>
  );
}
