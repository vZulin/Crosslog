import { describe, expect, it, vi } from "vitest";
import {
  type ClassifiedDroppedPath,
  type NativeDragDropPayload,
  TauriDragDropSource,
} from "../../src/tauri/tauri-drag-drop-source";

describe("TauriDragDropSource", () => {
  it("does not map DOM drop events, since Tauri intercepts native drops", async () => {
    const source = new TauriDragDropSource(async () => [], async () => () => {});

    await expect(source.mapDroppedSources()).resolves.toEqual([]);
  });

  it("maps native dropped file paths into file source refs with paths", async () => {
    const classify = vi.fn(
      async (): Promise<readonly ClassifiedDroppedPath[]> => [
        { path: "/var/log/app.log", kind: "file", name: "app.log" },
      ],
    );
    const source = new TauriDragDropSource(classify, async () => () => {});

    await expect(source.mapNativePaths(["/var/log/app.log"])).resolves.toEqual([
      {
        type: "file",
        source: {
          id: "desktop-file-var-log-app-log",
          name: "app.log",
          path: "/var/log/app.log",
        },
      },
    ]);
    expect(classify).toHaveBeenCalledWith(["/var/log/app.log"]);
  });

  it("maps native dropped directory paths into directory source refs with paths", async () => {
    const source = new TauriDragDropSource(
      async () => [{ path: "/Users/crosslog/logs", kind: "directory", name: "logs" }],
      async () => () => {},
    );

    await expect(source.mapNativePaths(["/Users/crosslog/logs"])).resolves.toEqual([
      {
        type: "directory",
        source: {
          id: "desktop-directory-users-crosslog-logs",
          name: "logs",
          path: "/Users/crosslog/logs",
        },
      },
    ]);
  });

  it("ignores missing paths that no longer resolve on the filesystem", async () => {
    const source = new TauriDragDropSource(
      async () => [
        { path: "/tmp/gone.log", kind: "missing", name: "gone.log" },
        { path: "/tmp/here.log", kind: "file", name: "here.log" },
      ],
      async () => () => {},
    );

    await expect(source.mapNativePaths(["/tmp/gone.log", "/tmp/here.log"])).resolves.toEqual([
      {
        type: "file",
        source: {
          id: "desktop-file-tmp-here-log",
          name: "here.log",
          path: "/tmp/here.log",
        },
      },
    ]);
  });

  it("delivers dropped sources to the handler on the native drop phase only", async () => {
    let emit: ((payload: NativeDragDropPayload) => void) | null = null;
    const unlisten = vi.fn();
    const source = new TauriDragDropSource(
      async (paths) => paths.map((path) => ({ path, kind: "file", name: "dropped.log" })),
      async (handler) => {
        emit = handler;
        return unlisten;
      },
    );

    const received: unknown[] = [];
    const dispose = await source.subscribeToNativeDrops((sources) => received.push(sources));

    emit?.({ type: "enter", paths: ["/ignored.log"] });
    emit?.({ type: "over", paths: ["/ignored.log"] });
    expect(received).toHaveLength(0);

    emit?.({ type: "drop", paths: ["/var/log/dropped.log"] });
    await vi.waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toEqual([
      {
        type: "file",
        source: {
          id: "desktop-file-var-log-dropped-log",
          name: "dropped.log",
          path: "/var/log/dropped.log",
        },
      },
    ]);

    dispose();
    expect(unlisten).toHaveBeenCalledTimes(1);
  });
});
