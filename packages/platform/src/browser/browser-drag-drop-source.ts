import type { DirectoryEntryDescriptor } from "../ports/directory-access-port";
import type { DragDropSource, DragDropSourcePort } from "../ports/drag-drop-source-port";

export class BrowserDragDropSource implements DragDropSourcePort {
  async mapDroppedSources(event: DragEvent): Promise<readonly DragDropSource[]> {
    const files = Array.from(event.dataTransfer?.files ?? []);
    const directoryGroups = new Map<string, DirectoryEntryDescriptor[]>();
    const sources: DragDropSource[] = [];

    for (const file of files) {
      const relativePath = file.webkitRelativePath;

      if (relativePath.includes("/")) {
        const [directoryName, fileName] = relativePath.split("/");

        if (!directoryName || !fileName || relativePath.split("/").length > 2) {
          continue;
        }

        const entries = directoryGroups.get(directoryName) ?? [];
        entries.push(createFileEntry(file, fileName));
        directoryGroups.set(directoryName, entries);
        continue;
      }

      sources.push({
        type: "file",
        source: {
          id: createBrowserSourceId(file.name, file.lastModified),
          name: file.name,
          file,
        },
      });
    }

    for (const [directoryName, entries] of directoryGroups) {
      sources.push({
        type: "directory",
        source: {
          id: createBrowserSourceId(directoryName, entries.length),
          name: directoryName,
          entries,
        },
      });
    }

    return sources;
  }
}

function createFileEntry(file: File, name: string): DirectoryEntryDescriptor {
  return {
    kind: "file",
    id: createBrowserSourceId(name, file.lastModified),
    name,
    createdAt: file.lastModified > 0 ? new Date(file.lastModified) : null,
    sizeBytes: file.size,
  };
}

function createBrowserSourceId(name: string, suffix: number): string {
  return `browser-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${suffix}`;
}
