import React from "react";
import type { CrosslogPlatform } from "@crosslog/platform";
import { FuturePaneToolbarSlot } from "../log-pane/FuturePaneToolbarSlot";

export interface AppShellProps {
  readonly platform: CrosslogPlatform;
}

export function AppShell({ platform }: AppShellProps) {
  return (
    <main aria-label="Crosslog workspace">
      <section aria-label="Empty workspace">
        <h1>Crosslog</h1>
        <button type="button">Open logs</button>
        <p>{platform.kind === "web" ? "Web workspace" : "Desktop workspace"}</p>
      </section>
      <FuturePaneToolbarSlot />
    </main>
  );
}
