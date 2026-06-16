import { describe, expect, it } from "vitest";
import type { FileSource } from "../../src/file-source/file-source";
import { appendRawLinesToChunks, flattenLineChunkText } from "../../src/file-source/line-chunk-store";
import { applyFileLifecycleEvent } from "../../src/file-source/file-lifecycle";

describe("file lifecycle", () => {
  it("appends new lines after the current loaded content", () => {
    const source = createSource(["first", "second"]);

    const updated = applyFileLifecycleEvent(source, {
      type: "append",
      lines: ["third", "fourth"],
    });

    expect(flattenLineChunkText(updated.lineChunks)).toEqual(["first", "second", "third", "fourth"]);
    expect(updated.deleted).toBe(false);
    expect(updated.replaced).toBe(false);
  });

  it("keeps loaded content searchable after deletion and ignores later appends", () => {
    const source = createSource(["retained line"]);

    const deleted = applyFileLifecycleEvent(source, { type: "delete" });
    const afterAppend = applyFileLifecycleEvent(deleted, { type: "append", lines: ["ignored line"] });

    expect(afterAppend.deleted).toBe(true);
    expect(afterAppend.watchState).toBe("stopped");
    expect(flattenLineChunkText(afterAppend.lineChunks)).toEqual(["retained line"]);
  });

  it("treats replacement content as a new file identity", () => {
    const source = applyFileLifecycleEvent(createSource(["old line"]), { type: "delete" });

    const replaced = applyFileLifecycleEvent(source, {
      type: "replace",
      identity: { value: "replacement-identity", platform: "desktop" },
      sizeBytes: 12,
      encoding: "utf-8",
      lines: ["new line"],
    });

    expect(replaced.fileIdentity.value).toBe("replacement-identity");
    expect(replaced.deleted).toBe(false);
    expect(replaced.replaced).toBe(true);
    expect(replaced.sizeBytes).toBe(12);
    expect(flattenLineChunkText(replaced.lineChunks)).toEqual(["new line"]);
  });

  it("creates append chunks with continuous one-based line numbers", () => {
    const chunks = appendRawLinesToChunks(createSource(["first"]).lineChunks, ["second", "third"]);

    expect(chunks.at(-1)?.startLineNumber).toBe(2);
    expect(chunks.flatMap((chunk) => chunk.lines.map((line) => line.lineNumber))).toEqual([1, 2, 3]);
  });
});

function createSource(lines: readonly string[]): FileSource {
  return {
    id: "source-app",
    fileIdentity: { value: "source-app", platform: "desktop" },
    displayName: "app.log",
    pathLabel: "/tmp/app.log",
    sizeBytes: lines.join("\n").length,
    encoding: "utf-8",
    lineChunks: appendRawLinesToChunks([], lines),
    watchState: "watching",
    deleted: false,
    replaced: false,
    readError: null,
  };
}
