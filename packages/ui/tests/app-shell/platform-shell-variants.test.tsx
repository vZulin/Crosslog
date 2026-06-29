import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityRailShell } from "../../src/app-shell/ActivityRailShell";
import type { PlatformShellVariant } from "../../src/app-shell/shellPresentation";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

describe("platform shell variants", () => {
  for (const variant of ["macos", "windows", "linux", "web"] as const) {
    it(`renders ${variant} chrome without changing shared product regions`, () => {
      const { getByTestId, queryByTestId } = renderShell(variant);
      const shell = getByTestId(redesignedShellTestIds.crosslogShell);

      expect(shell.getAttribute("data-platform")).toBe(variant);
      expect(getByTestId(redesignedShellTestIds.platformChrome).getAttribute("data-platform")).toBe(variant);
      expect(getByTestId(redesignedShellTestIds.platformChromeTitle).textContent).toBe("Crosslog");
      expect(getByTestId(redesignedShellTestIds.topbar).textContent).toContain("Command");
      expect(getByTestId(redesignedShellTestIds.activityRail).textContent).toContain("Rail");
      expect(getByTestId(redesignedShellTestIds.paneWorkspace).textContent).toContain("Workspace");
      expect(getByTestId(redesignedShellTestIds.statusBar).textContent).toContain("Status");

      expect(Boolean(queryByTestId(redesignedShellTestIds.platformChromeMacosTrafficLights))).toBe(
        variant === "macos",
      );
      expect(Boolean(queryByTestId(redesignedShellTestIds.platformChromeWindowsCaptionControls))).toBe(
        variant === "windows",
      );
      expect(Boolean(queryByTestId(redesignedShellTestIds.platformChromeLinuxCaptionControls))).toBe(
        variant === "linux",
      );
      expect(Boolean(queryByTestId(redesignedShellTestIds.platformChromeWebTitle))).toBe(
        variant === "web",
      );
    });
  }
});

function renderShell(platformShellVariant: PlatformShellVariant) {
  return render(
    <ActivityRailShell
      activityRail={<button type="button">Rail</button>}
      paneWorkspace={<section>Workspace</section>}
      platformShellVariant={platformShellVariant}
      statusBar={<span>Status</span>}
      themeVariant="light"
      topbar={<button type="button">Command</button>}
    />,
  );
}
