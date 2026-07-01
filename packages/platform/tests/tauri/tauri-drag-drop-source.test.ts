import { describe, expect, it } from "vitest";
import { TauriDragDropSource } from "../../src/tauri/tauri-drag-drop-source";

describe("TauriDragDropSource", () => {
  it("maps dropped desktop files into file source refs", async () => {
    const source = new TauriDragDropSource();
    const file = new File(["first line"], "desktop.log", { lastModified: 1_234 });

    await expect(source.mapDroppedSources(createDragEvent([file]))).resolves.toEqual([
      {
        type: "file",
        source: {
          id: "desktop-drop-desktop-log-1234",
          name: "desktop.log",
        },
      },
    ]);
  });

  it("maps dropped top-level directory files into a directory source ref", async () => {
    const source = new TauriDragDropSource();
    const appLog = createDirectoryFile("app.log", "logs/app.log", 1_234, 10);
    const nestedLog = createDirectoryFile("nested.log", "logs/archive/nested.log", 2_345, 20);

    await expect(source.mapDroppedSources(createDragEvent([appLog, nestedLog]))).resolves.toEqual([
      {
        type: "directory",
        source: {
          id: "desktop-drop-logs-1",
          name: "logs",
          entries: [
            {
              kind: "file",
              id: "desktop-drop-app-log-1234",
              name: "app.log",
              createdAt: new Date(1_234),
              sizeBytes: 10,
            },
          ],
        },
      },
    ]);
  });
});

function createDragEvent(files: readonly File[]): DragEvent {
  return {
    dataTransfer: {
      files,
    },
  } as unknown as DragEvent;
}

function createDirectoryFile(
  name: string,
  relativePath: string,
  lastModified: number,
  size: number,
): File {
  const file = new File(["x".repeat(size)], name, { lastModified });

  Object.defineProperty(file, "webkitRelativePath", {
    configurable: true,
    value: relativePath,
  });

  return file;
}
