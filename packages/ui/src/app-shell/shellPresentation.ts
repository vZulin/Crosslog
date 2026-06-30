export const themeVariants = ["light", "dark"] as const;
export type ThemeVariant = (typeof themeVariants)[number];

export const themePreferences = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof themePreferences)[number];

export const platformShellVariants = ["macos", "windows", "linux", "web"] as const;
export type PlatformShellVariant = (typeof platformShellVariants)[number];

export type ShellRuntimeKind = "web" | "desktop";

export interface ShellPresentation {
  readonly themeVariant: ThemeVariant;
  readonly platformShellVariant: PlatformShellVariant;
}

export interface ShellPresentationOverrides {
  readonly themeVariant?: string | null;
  readonly platformShellVariant?: string | null;
}

export interface ShellPresentationEnvironment {
  readonly runtimeKind: ShellRuntimeKind;
  readonly platform?: string | null;
  readonly userAgent?: string | null;
}

export interface ShellPresentationResolutionInput
  extends ShellPresentationEnvironment,
    ShellPresentationOverrides {
  readonly fallbackThemeVariant?: ThemeVariant;
  readonly fallbackPlatformShellVariant?: PlatformShellVariant;
}

export const defaultThemeVariant: ThemeVariant = "light";
export const defaultThemePreference: ThemePreference = "system";
export const defaultWebPlatformShellVariant: PlatformShellVariant = "web";
export const defaultDesktopPlatformShellVariant: PlatformShellVariant = "macos";
export const systemThemeMediaQuery = "(prefers-color-scheme: dark)";

export const shellPresentationQueryParams = {
  theme: "crosslog-theme",
  platform: "crosslog-platform",
} as const;

export const shellPresentationChangeEventName = "crosslog:shell-presentation-change";

export function isThemeVariant(value: unknown): value is ThemeVariant {
  return themeVariants.includes(value as ThemeVariant);
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}

export function isPlatformShellVariant(value: unknown): value is PlatformShellVariant {
  return platformShellVariants.includes(value as PlatformShellVariant);
}

export function resolveThemeVariant(
  value: unknown,
  fallback: ThemeVariant = defaultThemeVariant,
): ThemeVariant {
  const normalized = normalizeVariantToken(value);

  return isThemeVariant(normalized) ? normalized : fallback;
}

export function resolveThemePreference(
  value: unknown,
  fallback: ThemePreference = defaultThemePreference,
): ThemePreference {
  const normalized = normalizeVariantToken(value);

  return isThemePreference(normalized) ? normalized : fallback;
}

export function resolveThemePreferenceVariant(
  preference: ThemePreference,
  systemThemeVariant: ThemeVariant = defaultThemeVariant,
): ThemeVariant {
  return preference === "system" ? systemThemeVariant : preference;
}

export function resolveSystemThemeVariant(
  prefersDark: boolean | null | undefined,
  fallback: ThemeVariant = defaultThemeVariant,
): ThemeVariant {
  if (typeof prefersDark !== "boolean") {
    return fallback;
  }

  return prefersDark ? "dark" : "light";
}

export function resolvePlatformShellVariant(
  value: unknown,
  fallback: PlatformShellVariant = defaultDesktopPlatformShellVariant,
): PlatformShellVariant {
  const normalized = normalizeVariantToken(value);

  return isPlatformShellVariant(normalized) ? normalized : fallback;
}

export function resolveRuntimePlatformShellVariant(
  runtimeKind: ShellRuntimeKind,
  environment: Omit<ShellPresentationEnvironment, "runtimeKind"> = {},
): PlatformShellVariant {
  if (runtimeKind === "web") {
    return defaultWebPlatformShellVariant;
  }

  const runtimeText = `${environment.platform ?? ""} ${environment.userAgent ?? ""}`.toLowerCase();

  if (runtimeText.includes("mac") || runtimeText.includes("darwin")) {
    return "macos";
  }

  if (runtimeText.includes("win")) {
    return "windows";
  }

  if (
    runtimeText.includes("linux") ||
    runtimeText.includes("x11") ||
    runtimeText.includes("wayland") ||
    runtimeText.includes("ubuntu") ||
    runtimeText.includes("fedora")
  ) {
    return "linux";
  }

  return defaultDesktopPlatformShellVariant;
}

export function resolveShellPresentation(input: ShellPresentationResolutionInput): ShellPresentation {
  const runtimePlatformVariant = resolveRuntimePlatformShellVariant(input.runtimeKind, {
    platform: input.platform,
    userAgent: input.userAgent,
  });

  return {
    themeVariant: resolveThemeVariant(
      input.themeVariant,
      input.fallbackThemeVariant ?? defaultThemeVariant,
    ),
    platformShellVariant: resolvePlatformShellVariant(
      input.platformShellVariant,
      input.fallbackPlatformShellVariant ?? runtimePlatformVariant,
    ),
  };
}

export function parseShellPresentationSearchParams(
  search: string | URLSearchParams | null | undefined,
): ShellPresentationOverrides {
  const params = toSearchParams(search);

  return {
    themeVariant: params.get(shellPresentationQueryParams.theme),
    platformShellVariant: params.get(shellPresentationQueryParams.platform),
  };
}

function normalizeVariantToken(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

function toSearchParams(search: string | URLSearchParams | null | undefined): URLSearchParams {
  if (search instanceof URLSearchParams) {
    return search;
  }

  if (!search) {
    return new URLSearchParams();
  }

  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}
