import React from "react";
import type { PlatformShellVariant } from "./shellPresentation";
import { redesignedShellTestIds } from "./testIds";

export interface WindowChromeProps {
  readonly platformShellVariant: PlatformShellVariant;
  readonly renderMacosTrafficLights?: boolean;
}

export function WindowChrome({
  platformShellVariant,
  renderMacosTrafficLights = true,
}: WindowChromeProps) {
  return (
    <div
      aria-label={`${platformShellVariant} shell chrome`}
      className="crosslog-window-chrome"
      data-platform={platformShellVariant}
      data-testid={redesignedShellTestIds.platformChrome}
    >
      <span
        className="crosslog-window-chrome__title"
        data-testid={redesignedShellTestIds.platformChromeTitle}
      >
        Crosslog
      </span>
      {platformShellVariant === "macos" && renderMacosTrafficLights ? <MacosTrafficLights /> : null}
      {platformShellVariant === "windows" ? <WindowsCaptionControls /> : null}
      {platformShellVariant === "linux" ? <LinuxCaptionControls /> : null}
      {platformShellVariant === "web" ? <WebTitleMarker /> : null}
    </div>
  );
}

function MacosTrafficLights() {
  return (
    <span
      aria-label="macOS traffic lights"
      className="crosslog-window-chrome__traffic-lights"
      data-testid={redesignedShellTestIds.platformChromeMacosTrafficLights}
    >
      <span className="crosslog-window-chrome__traffic-light crosslog-window-chrome__traffic-light--close" />
      <span className="crosslog-window-chrome__traffic-light crosslog-window-chrome__traffic-light--minimize" />
      <span className="crosslog-window-chrome__traffic-light crosslog-window-chrome__traffic-light--zoom" />
    </span>
  );
}

function WindowsCaptionControls() {
  return (
    <span
      aria-label="Windows caption controls"
      className="crosslog-window-chrome__caption-controls crosslog-window-chrome__caption-controls--windows"
      data-testid={redesignedShellTestIds.platformChromeWindowsCaptionControls}
    >
      <span aria-hidden="true">_</span>
      <span aria-hidden="true">[]</span>
      <span aria-hidden="true">X</span>
    </span>
  );
}

function LinuxCaptionControls() {
  return (
    <span
      aria-label="Linux caption controls"
      className="crosslog-window-chrome__caption-controls crosslog-window-chrome__caption-controls--linux"
      data-testid={redesignedShellTestIds.platformChromeLinuxCaptionControls}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </span>
  );
}

function WebTitleMarker() {
  return (
    <span
      aria-label="Web shell title"
      className="crosslog-window-chrome__web-title"
      data-testid={redesignedShellTestIds.platformChromeWebTitle}
    >
      Crosslog
    </span>
  );
}
