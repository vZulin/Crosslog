import React from "react";
import type { ThemePreference, ThemeVariant } from "./shellPresentation";
import { themePreferences } from "./shellPresentation";
import { IconButton } from "./IconButton";
import { Popover, type PopoverFocusReturnRef } from "./Popover";
import { redesignedShellTestIds } from "./testIds";

export interface SettingsSurfaceProps {
  readonly themePreference: ThemePreference;
  readonly resolvedThemeVariant: ThemeVariant;
  readonly returnFocusRef?: PopoverFocusReturnRef;
  readonly onThemePreferenceChange: (themePreference: ThemePreference) => void;
  readonly onClose: () => void;
}

const themePreferenceLabels = {
  system: "System",
  light: "Light",
  dark: "Dark",
} as const satisfies Record<ThemePreference, string>;

const themePreferenceTestIds = {
  system: redesignedShellTestIds.settingsThemeSystem,
  light: redesignedShellTestIds.settingsThemeLight,
  dark: redesignedShellTestIds.settingsThemeDark,
} as const satisfies Record<ThemePreference, string>;

export function SettingsSurface({
  themePreference,
  resolvedThemeVariant,
  returnFocusRef,
  onThemePreferenceChange,
  onClose,
}: SettingsSurfaceProps) {
  return (
    <Popover
      className="crosslog-settings-surface"
      label="Settings"
      onEscapeKeyDown={onClose}
      returnFocusRef={returnFocusRef}
      testId={redesignedShellTestIds.settingsSurface}
    >
      <div className="crosslog-settings-surface__header">
        <h2 className="crosslog-settings-surface__title">Settings</h2>
        <IconButton
          className="crosslog-settings-surface__close"
          icon="close"
          label="Close Settings"
          onClick={onClose}
          tooltip="Close Settings"
        />
      </div>
      <fieldset className="crosslog-settings-surface__group">
        <legend className="crosslog-settings-surface__legend">Theme</legend>
        <div className="crosslog-settings-surface__theme-options">
          {themePreferences.map((preference) => (
            <label
              className="crosslog-settings-surface__theme-option"
              data-active={themePreference === preference ? "true" : undefined}
              key={preference}
            >
              <input
                checked={themePreference === preference}
                data-testid={themePreferenceTestIds[preference]}
                name="crosslog-theme-preference"
                onChange={() => onThemePreferenceChange(preference)}
                type="radio"
                value={preference}
              />
              <span>{themePreferenceLabels[preference]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <span className="crosslog-sr-only" data-resolved-theme={resolvedThemeVariant}>
        Resolved theme: {resolvedThemeVariant}
      </span>
    </Popover>
  );
}
