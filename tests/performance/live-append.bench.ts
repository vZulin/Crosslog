import { bench, describe } from "vitest";
import { appendRawLinesToChunks, flattenLineChunkText } from "../../packages/core/src/file-source/line-chunk-store";

describe("live append", () => {
  bench("appends live lines to an existing chunk store", () => {
    const chunks = appendRawLinesToChunks(
      [],
      Array.from({ length: 100_000 }, (_, index) => `existing line ${index + 1}`),
    );
    const updated = appendRawLinesToChunks(
      chunks,
      Array.from({ length: 1_000 }, (_, index) => `appended line ${index + 1}`),
    );

    if (flattenLineChunkText(updated).length !== 101_000) {
      throw new Error("Append benchmark produced an invalid line count.");
    }
  });
});
