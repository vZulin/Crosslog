import { describe, expect, it } from "vitest";
import { applyTimeOffset, normalizeTimeOffset, timeOffsetToMilliseconds } from "../../src/sync/time-offset";

describe("time offset", () => {
  it("normalizes overflowing units into a stable representation", () => {
    expect(
      normalizeTimeOffset({
        days: 0,
        hours: 25,
        minutes: 61,
        seconds: 61,
        milliseconds: 1001,
      }),
    ).toEqual({
      days: 1,
      hours: 2,
      minutes: 2,
      seconds: 2,
      milliseconds: 1,
    });
  });

  it("converts offsets to milliseconds and applies them to timestamps", () => {
    const offset = { days: 0, hours: 1, minutes: 30, seconds: 15, milliseconds: 250 };
    const timestamp = new Date("2026-06-16T09:00:00.000Z");

    expect(timeOffsetToMilliseconds(offset)).toBe(5_415_250);
    expect(applyTimeOffset(timestamp, offset).toISOString()).toBe("2026-06-16T10:30:15.250Z");
  });
});
