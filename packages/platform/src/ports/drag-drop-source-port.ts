import type { DirectorySourceRef } from "./directory-access-port";
import type { FileSourceRef } from "./file-access-port";

export type DragDropSource =
  | { readonly type: "file"; readonly source: FileSourceRef }
  | { readonly type: "directory"; readonly source: DirectorySourceRef };

export interface DragDropSourcePort {
  mapDroppedSources(event: DragEvent): Promise<readonly DragDropSource[]>;
}

