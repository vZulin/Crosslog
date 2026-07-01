import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import {
  AppShell,
  IconPreview,
  parseShellPresentationSearchParams,
  resolveShellPresentation,
  shellPresentationChangeEventName,
} from "@crosslog/ui";
import "@crosslog/ui/app-shell/activity-rail-theme.css";

export interface AppProps {
  readonly platform: CrosslogPlatform;
}

export function App({ platform }: AppProps) {
  const { hasThemeOverride, shellPresentation } = useCurrentShellPresentation(platform.kind);

  if (shouldShowIconPreview()) {
    return <IconPreview />;
  }

  return (
    <AppShell
      platform={platform}
      shellPresentation={shellPresentation}
      useShellPresentationTheme={hasThemeOverride}
    />
  );
}

function shouldShowIconPreview(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).has("icon-preview");
}

function resolveCurrentShellPresentation(runtimeKind: CrosslogPlatform["kind"], search = getCurrentSearch()) {
  const overrides = parseShellPresentationSearchParams(search);

  return resolveShellPresentation({
    runtimeKind,
    ...overrides,
    platform: getNavigatorPlatform(),
    userAgent: getNavigatorUserAgent(),
  });
}

function useCurrentShellPresentation(runtimeKind: CrosslogPlatform["kind"]) {
  const [presentationSearch, setPresentationSearch] = React.useState(() => getCurrentSearch());

  React.useEffect(() => {
    const handlePresentationChange = () => setPresentationSearch(getCurrentSearch());

    window.addEventListener("popstate", handlePresentationChange);
    window.addEventListener(shellPresentationChangeEventName, handlePresentationChange);

    return () => {
      window.removeEventListener("popstate", handlePresentationChange);
      window.removeEventListener(shellPresentationChangeEventName, handlePresentationChange);
    };
  }, []);

  return React.useMemo(
    () => ({
      hasThemeOverride: hasShellThemeOverride(presentationSearch),
      shellPresentation: resolveCurrentShellPresentation(runtimeKind, presentationSearch),
    }),
    [presentationSearch, runtimeKind],
  );
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

function hasShellThemeOverride(search: string): boolean {
  return parseShellPresentationSearchParams(search).themeVariant !== null;
}
