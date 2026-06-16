import { bench, describe } from "vitest";
import {
  createDirectoryFileEntry,
  createDirectorySource,
  directorySourceReducer,
} from "../../packages/core/src";

describe("directory switch threshold", () => {
  bench("keeps repeated directory switches under the release threshold", () => {
    const source = createDirectorySource({
      id: "threshold-directory",
      directoryIdentity: { value: "threshold-directory", platform: "web" },
      displayName: "threshold-directory",
      files: Array.from({ length: 5_000 }, (_, index) =>
        createDirectoryFileEntry({
          identity: { value: `file-${index}`, platform: "web" },
          name: `service-${String(index).padStart(5, "0")}.log`,
          createdAt: new Date(Date.UTC(2026, 5, 16, 0, 0, index)),
          sizeBytes: 4096,
        }),
      ),
    });

    let current = source;
    const startedAt = performance.now();

    for (let index = 0; index < 200; index += 1) {
      current = directorySourceReducer(current, { type: "navigate", direction: "next" });
    }

    const elapsedMs = performance.now() - startedAt;

    if (current.currentFileId === source.currentFileId || elapsedMs > 200) {
      throw new Error(`Directory switch threshold exceeded: ${elapsedMs.toFixed(2)} ms.`);
    }
  });
});
