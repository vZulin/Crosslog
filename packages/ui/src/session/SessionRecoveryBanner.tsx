import React from "react";

export interface SessionRecoveryBannerProps {
  readonly message: string | null;
}

export function SessionRecoveryBanner({ message }: SessionRecoveryBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" aria-label="Session recovery status">
      {message}
    </p>
  );
}
