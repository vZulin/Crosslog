import type { CapabilityReport } from "@crosslog/core";
import type { SessionStorePort } from "./ports/session-store-port";

export interface CrosslogPlatform {
  readonly kind: "web" | "desktop";
  readonly capabilities: CapabilityReport;
  readonly sessionStore: SessionStorePort;
}

export type * from "./ports/capability-port";
export type * from "./ports/directory-access-port";
export type * from "./ports/drag-drop-source-port";
export type * from "./ports/file-access-port";
export type * from "./ports/file-watcher-port";
export type * from "./ports/session-store-port";
export type * from "./ports/source-picker-port";
export * from "./browser/browser-file-watcher";
export * from "./browser/browser-directory-access";
export * from "./browser/browser-session-store";
export * from "./tauri/tauri-file-watcher";
export * from "./tauri/tauri-directory-access";
export * from "./tauri/tauri-session-store";
