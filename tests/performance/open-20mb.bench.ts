import { bench, describe } from "vitest";
import { evaluateFileOpenPolicy } from "../../packages/core/src/file-source/file-open-policy";
import { appendRawLinesToChunks, flattenLineChunkText } from "../../packages/core/src/file-source/line-chunk-store";
import { large20MbLogFixture } from "../fixtures/large-20mb-log.fixture";

const twentyMbLines = createTwentyMbLines();

describe("20 MB open", () => {
  bench("accepts and chunks canonical 20 MB log content", () => {
    const totalBytes = twentyMbLines.reduce((total, line) => total + Buffer.byteLength(`${line}\n`, "utf8"), 0);
    const policy = evaluateFileOpenPolicy(totalBytes, {
      maxFileSizeBytes: large20MbLogFixture.sizeBytes,
      availableMemoryBytes: large20MbLogFixture.sizeBytes * 2,
    });

    if (!policy.accepted) {
      throw new Error("20 MB open benchmark was rejected by file open policy.");
    }

    const chunks = appendRawLinesToChunks([], twentyMbLines);

    if (flattenLineChunkText(chunks).length !== twentyMbLines.length) {
      throw new Error("20 MB open benchmark lost lines while chunking content.");
    }
  });
});

function createTwentyMbLines(): readonly string[] {
  const line = "2026-06-16T12:00:00.000Z INFO worker=release-fixture message=stable-open-benchmark ";
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  const lineCount = Math.floor(large20MbLogFixture.sizeBytes / lineBytes);

  return Array.from({ length: lineCount }, (_, index) => `${line}${index.toString().padStart(6, "0")}`);
}
