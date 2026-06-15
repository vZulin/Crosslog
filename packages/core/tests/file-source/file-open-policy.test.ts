import { describe, expect, it } from "vitest";
import { defaultFileOpenPolicy, evaluateFileOpenPolicy } from "../../src/file-source/file-open-policy";

describe("file open policy", () => {
  it("accepts files within the configured size limit", () => {
    expect(evaluateFileOpenPolicy(defaultFileOpenPolicy.maxFileSizeBytes).accepted).toBe(true);
  });

  it("rejects files above the configured size limit before loading", () => {
    const result = evaluateFileOpenPolicy(defaultFileOpenPolicy.maxFileSizeBytes + 1);

    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.error.code).toBe("FileTooLarge");
    }
  });
});

