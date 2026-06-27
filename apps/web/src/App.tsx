import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell, IconPreview } from "@crosslog/ui";

export interface AppProps {
  readonly platform: CrosslogPlatform;
}

export function App({ platform }: AppProps) {
  if (shouldShowIconPreview()) {
    return <IconPreview />;
  }

  return <AppShell platform={platform} />;
}

function shouldShowIconPreview(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).has("icon-preview");
}
