import { describe, expect, it } from "vitest";
import { formatTimeOffset } from "../../src/sync/time-offset";

describe("time offset formatting", () => {
  it("formats zero offsets for compact header tags", () => {
    expect(formatTimeOffset({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })).toBe("0 ms");
  });

  it("omits zero units after normalization", () => {
    expect(formatTimeOffset({ days: 0, hours: 0, minutes: 61, seconds: 0, milliseconds: 250 })).toBe(
      "+1h 1m 250ms",
    );
  });

  it("formats negative normalized offsets with one leading sign", () => {
    expect(formatTimeOffset({ days: 0, hours: -26, minutes: -3, seconds: -4, milliseconds: -5 })).toBe(
      "-1d 2h 3m 4s 5ms",
    );
  });
});
