import { describe, expect, it } from "vitest";
import { selectEncoding } from "../../src/encoding/encoding-selection";

describe("encoding selection", () => {
  it("uses detected encoding when no manual selection exists", () => {
    expect(selectEncoding("utf-8", null).selectedEncoding).toBe("utf-8");
  });

  it("flags failed detection for manual selection", () => {
    expect(selectEncoding(null, "windows-1251").detectionFailed).toBe(true);
  });
});

