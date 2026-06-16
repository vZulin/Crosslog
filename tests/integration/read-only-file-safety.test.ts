import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { appendRawLinesToChunks } from "../../packages/core/src/file-source/line-chunk-store";
import { applyFileLifecycleEvent } from "../../packages/core/src/file-source/file-lifecycle";
import { assertFileBytesUnchanged } from "./helpers/read-only-assertions";

describe("read-only file safety", () => {
  it("does not mutate the opened file while processing lifecycle events", async () => {
    const directory = await mkdtemp(join(tmpdir(), "crosslog-read-only-"));
    const filePath = join(directory, "app.log");
    await writeFile(filePath, "first line\nsecond line\n", "utf8");

    await expect(
      assertFileBytesUnchanged(filePath, async () => {
        const source = {
          id: "source-app",
          fileIdentity: { value: filePath, platform: "desktop" as const },
          displayName: "app.log",
          pathLabel: filePath,
          sizeBytes: 23,
          encoding: "utf-8",
          lineChunks: appendRawLinesToChunks([], ["first line", "second line"]),
          watchState: "watching" as const,
          deleted: false,
          replaced: false,
          readError: null,
        };

        applyFileLifecycleEvent(source, { type: "append", lines: ["third line"] });
        applyFileLifecycleEvent(source, { type: "delete" });
      }),
    ).resolves.toBeUndefined();
  });
});
