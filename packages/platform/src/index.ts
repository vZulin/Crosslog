import type { CapabilityReport } from "@crosslog/core";

export interface CrosslogPlatform {
  readonly kind: "web" | "desktop";
  readonly capabilities: CapabilityReport;
}

export type * from "./ports/capability-port";
export type * from "./ports/directory-access-port";
export type * from "./ports/drag-drop-source-port";
export type * from "./ports/file-access-port";
export type * from "./ports/file-watcher-port";
export type * from "./ports/session-store-port";
export type * from "./ports/source-picker-port";

