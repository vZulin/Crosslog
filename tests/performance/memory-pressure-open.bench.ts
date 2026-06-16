import { bench, describe } from "vitest";
import { evaluateFileOpenPolicy } from "../../packages/core/src/file-source/file-open-policy";

describe("memory pressure open policy", () => {
  bench("rejects oversized opens before line chunks are allocated", () => {
    const result = evaluateFileOpenPolicy(18 * 1024 * 1024, {
      maxFileSizeBytes: 20 * 1024 * 1024,
      availableMemoryBytes: 12 * 1024 * 1024,
    });

    if (result.accepted || result.error.code !== "InsufficientMemory") {
      throw new Error("Memory pressure benchmark did not reject the open before loading.");
    }
  });
});
