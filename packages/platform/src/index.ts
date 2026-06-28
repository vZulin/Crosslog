import type { CapabilityReport } from "@crosslog/core";
import type { DirectoryAccessPort } from "./ports/directory-access-port";
import type { DragDropSourcePort } from "./ports/drag-drop-source-port";
import type { FileAccessPort } from "./ports/file-access-port";
import type { SessionStorePort } from "./ports/session-store-port";
import type { UiTestBridge } from "./ports/ui-test-bridge-port";

export interface CrosslogPlatform {
  readonly kind: "web" | "desktop";
  readonly capabilities: CapabilityReport;
  readonly fileAccess: FileAccessPort;
  readonly directoryAccess: DirectoryAccessPort;
  readonly dragDropSource: DragDropSourcePort;
  readonly sessionStore: SessionStorePort;
  readonly uiTestBridge?: UiTestBridge;
}

export type * from "./ports/capability-port";
export type * from "./ports/directory-access-port";
export type * from "./ports/drag-drop-source-port";
export type * from "./ports/file-access-port";
export type * from "./ports/file-watcher-port";
export type * from "./ports/session-store-port";
export type * from "./ports/source-picker-port";
export * from "./ports/ui-test-bridge-port";
export * from "./browser/browser-file-watcher";
export * from "./browser/browser-file-access";
export * from "./browser/browser-directory-access";
export * from "./browser/browser-drag-drop-source";
export * from "./browser/browser-session-store";
export * from "./browser/browser-capabilities";
export * from "./tauri/tauri-file-access";
export * from "./tauri/tauri-file-watcher";
export * from "./tauri/tauri-directory-access";
export * from "./tauri/tauri-drag-drop-source";
export * from "./tauri/tauri-capabilities";
export * from "./tauri/tauri-session-store";
export * from "./tauri/tauri-ui-test-bridge";
