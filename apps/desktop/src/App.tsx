import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import {
  AppShell,
  parseShellPresentationSearchParams,
  resolveShellPresentation,
} from "@crosslog/ui";
import "@crosslog/ui/app-shell/activity-rail-theme.css";

export interface AppProps {
  readonly platform: CrosslogPlatform;
}

export function App({ platform }: AppProps) {
  return (
    <AppShell
      platform={platform}
      shellPresentation={resolveCurrentShellPresentation(platform.kind)}
    />
  );
}

function resolveCurrentShellPresentation(runtimeKind: CrosslogPlatform["kind"]) {
  const overrides = parseShellPresentationSearchParams(getCurrentSearch());

  return resolveShellPresentation({
    runtimeKind,
    ...overrides,
    platform: getNavigatorPlatform(),
    userAgent: getNavigatorUserAgent(),
  });
}

function getCurrentSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

function getNavigatorPlatform(): string | null {
  return typeof navigator === "undefined" ? null : navigator.platform;
}

function getNavigatorUserAgent(): string | null {
  return typeof navigator === "undefined" ? null : navigator.userAgent;
}
