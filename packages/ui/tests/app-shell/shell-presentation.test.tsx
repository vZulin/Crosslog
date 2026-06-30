import { describe, expect, it } from "vitest";
import {
  defaultThemePreference,
  parseShellPresentationSearchParams,
  resolveThemePreference,
  resolveThemePreferenceVariant,
  resolveRuntimePlatformShellVariant,
  resolveShellPresentation,
  resolveSystemThemeVariant,
  shellPresentationQueryParams,
} from "../../src/app-shell/shellPresentation";

describe("shell presentation helpers", () => {
  it("defaults Web to light theme and Web shell chrome", () => {
    expect(resolveShellPresentation({ runtimeKind: "web" })).toEqual({
      themeVariant: "light",
      platformShellVariant: "web",
    });
  });

  it("derives Desktop shell chrome from runtime platform hints", () => {
    expect(
      resolveRuntimePlatformShellVariant("desktop", {
        platform: "MacIntel",
        userAgent: "Crosslog",
      }),
    ).toBe("macos");
    expect(
      resolveRuntimePlatformShellVariant("desktop", {
        platform: "Win32",
        userAgent: "Windows NT 10.0",
      }),
    ).toBe("windows");
    expect(
      resolveRuntimePlatformShellVariant("desktop", {
        platform: "Linux x86_64",
        userAgent: "X11; Linux x86_64",
      }),
    ).toBe("linux");
  });

  it("accepts valid query override parameters", () => {
    const overrides = parseShellPresentationSearchParams(
      `?${shellPresentationQueryParams.theme}=dark&${shellPresentationQueryParams.platform}=linux`,
    );

    expect(resolveShellPresentation({ runtimeKind: "web", ...overrides })).toEqual({
      themeVariant: "dark",
      platformShellVariant: "linux",
    });
  });

  it("normalizes valid override casing and falls back for invalid values", () => {
    expect(
      resolveShellPresentation({
        runtimeKind: "desktop",
        platform: "MacIntel",
        themeVariant: " DARK ",
        platformShellVariant: " WINDOWS ",
      }),
    ).toEqual({
      themeVariant: "dark",
      platformShellVariant: "windows",
    });

    expect(
      resolveShellPresentation({
        runtimeKind: "desktop",
        platform: "MacIntel",
        themeVariant: "sepia",
        platformShellVariant: "android",
      }),
    ).toEqual({
      themeVariant: "light",
      platformShellVariant: "macos",
    });
  });

  it("resolves product theme preference independently from presentation overrides", () => {
    expect(defaultThemePreference).toBe("system");
    expect(resolveThemePreference(undefined)).toBe("system");
    expect(resolveThemePreference(" DARK ")).toBe("dark");
    expect(resolveThemePreference("sepia")).toBe("system");
    expect(resolveThemePreferenceVariant("system", "dark")).toBe("dark");
    expect(resolveThemePreferenceVariant("system", "light")).toBe("light");
    expect(resolveThemePreferenceVariant("light", "dark")).toBe("light");
    expect(resolveThemePreferenceVariant("dark", "light")).toBe("dark");
  });

  it("maps system theme media state to a resolved shell theme variant", () => {
    expect(resolveSystemThemeVariant(true)).toBe("dark");
    expect(resolveSystemThemeVariant(false)).toBe("light");
    expect(resolveSystemThemeVariant(null)).toBe("light");
  });
});
