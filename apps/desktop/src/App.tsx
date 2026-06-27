import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "@crosslog/ui";
import "@crosslog/ui/app-shell/activity-rail-theme.css";

export interface AppProps {
  readonly platform: CrosslogPlatform;
}

export function App({ platform }: AppProps) {
  return <AppShell platform={platform} />;
}
