import type { DragDropSourcePort } from "../ports/drag-drop-source-port";

export class TauriDragDropSource implements DragDropSourcePort {
  async mapDroppedSources() {
    return [];
  }
}

