import React from "react";
import { CrosslogIcon, type CrosslogIconName } from "./icons";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children" | "title"> {
  readonly icon: CrosslogIconName;
  readonly label: string;
  readonly active?: boolean;
  readonly pressed?: boolean;
  readonly testId?: string;
  readonly tooltip?: string;
  readonly unavailable?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    active = false,
    className,
    disabled = false,
    icon,
    label,
    pressed,
    testId,
    tooltip,
    type = "button",
    unavailable = false,
    ...buttonProps
  },
  ref,
) {
  const isDisabled = disabled || unavailable;
  const classes = ["crosslog-icon-button", className].filter(Boolean).join(" ");

  return (
    <button
      aria-disabled={unavailable ? true : undefined}
      aria-label={label}
      aria-pressed={pressed}
      className={classes}
      data-active={active ? "true" : undefined}
      data-testid={testId}
      data-unavailable={unavailable ? "true" : undefined}
      disabled={isDisabled}
      ref={ref}
      title={tooltip ?? label}
      type={type}
      {...buttonProps}
    >
      <CrosslogIcon name={icon} />
    </button>
  );
});
