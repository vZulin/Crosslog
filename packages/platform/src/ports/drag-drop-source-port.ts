import type { DirectorySourceRef } from "./directory-access-port";
import type { FileSourceRef } from "./file-access-port";

export type DragDropSource =
  | { readonly type: "file"; readonly source: FileSourceRef }
  | { readonly type: "directory"; readonly source: DirectorySourceRef };

export type NativeDropHandler = (sources: readonly DragDropSource[]) => void;

export interface DragDropSourcePort {
  /**
   * Map a DOM drag-and-drop event into sources. Used by the browser adapter,
   * where OS drops surface as `DragEvent.dataTransfer`. Platforms whose native
   * drops never reach the DOM (Tauri) may return an empty list here and instead
   * deliver drops through {@link subscribeToNativeDrops}.
   */
  mapDroppedSources(event: DragEvent): Promise<readonly DragDropSource[]>;

  /**
   * Subscribe to native OS drag-and-drop events that bypass the DOM (Tauri
   * intercepts native file drops before the webview sees them). Returns an
   * unsubscribe function. Optional: platforms that fully handle drops through
   * {@link mapDroppedSources} (browser) do not implement it.
   */
  subscribeToNativeDrops?(handler: NativeDropHandler): Promise<() => void>;
}
