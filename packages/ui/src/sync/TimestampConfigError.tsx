import React from "react";

export interface TimestampConfigErrorProps {
  readonly message: string | null;
}

export function TimestampConfigError({ message }: TimestampConfigErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div role="alert" data-testid="timestamp-config-error">
      Invalid timestamp configuration: {message}
    </div>
  );
}
