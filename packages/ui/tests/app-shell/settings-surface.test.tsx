import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsSurface } from "../../src/app-shell/SettingsSurface";

describe("SettingsSurface", () => {
  it("renders accessible System, Light, and Dark theme choices", () => {
    const onThemePreferenceChange = vi.fn();
    const { getByRole } = render(
      <SettingsSurface
        onClose={vi.fn()}
        onThemePreferenceChange={onThemePreferenceChange}
        resolvedThemeVariant="light"
        themePreference="system"
      />,
    );

    expect(getByRole("dialog", { name: "Settings" })).toBeTruthy();
    expect(getByRole("group", { name: "Theme" })).toBeTruthy();
    expect((getByRole("radio", { name: "System" }) as HTMLInputElement).checked).toBe(true);
    expect((getByRole("radio", { name: "Light" }) as HTMLInputElement).checked).toBe(false);
    expect((getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(false);

    fireEvent.click(getByRole("radio", { name: "Dark" }));
    expect(onThemePreferenceChange).toHaveBeenCalledWith("dark");
  });

  it("closes from the close button and Escape key", () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <SettingsSurface
        onClose={onClose}
        onThemePreferenceChange={vi.fn()}
        resolvedThemeVariant="dark"
        themePreference="dark"
      />,
    );

    fireEvent.click(getByRole("button", { name: "Close Settings" }));
    fireEvent.keyDown(getByRole("dialog", { name: "Settings" }), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
