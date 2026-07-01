import { describe, expect, it } from "vitest";
import {
  applyTimeOffset,
  createTimeOffsetDraft,
  normalizeTimeOffset,
  timeOffsetToMilliseconds,
  validateTimeOffsetDraft,
} from "../../src/sync/time-offset";

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

  it("accepts documented draft boundaries before apply", () => {
    expect(
      validateTimeOffsetDraft({
        days: "999999",
        hours: "23",
        minutes: "59",
        seconds: "59",
        milliseconds: "999",
      }),
    ).toEqual({
      valid: true,
      offset: {
        days: 999999,
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      },
      errors: [],
    });

    expect(
      validateTimeOffsetDraft({
        days: "-42",
        hours: "0",
        minutes: "0",
        seconds: "0",
        milliseconds: "0",
      }),
    ).toEqual({
      valid: true,
      offset: {
        days: -42,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      },
      errors: [],
    });
  });

  it("rejects non-whole and out-of-range draft fields before normalization", () => {
    const result = validateTimeOffsetDraft({
      days: "1.5",
      hours: "24",
      minutes: "60",
      seconds: "-1",
      milliseconds: "1000",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { field: "days", code: "notWholeNumber", message: "Days must be a whole number." },
      { field: "hours", code: "outOfRange", message: "Hours must be 0-23." },
      { field: "minutes", code: "outOfRange", message: "Minutes must be 0-59." },
      { field: "seconds", code: "outOfRange", message: "Seconds must be 0-59." },
      { field: "milliseconds", code: "outOfRange", message: "Milliseconds must be 0-999." },
    ]);
  });

  it("treats blank draft fields as zero", () => {
    expect(
      validateTimeOffsetDraft({
        days: "",
        hours: " ",
        minutes: "",
        seconds: "",
        milliseconds: "",
      }),
    ).toEqual({
      valid: true,
      offset: {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      },
      errors: [],
    });
  });

  it("creates field-bound drafts for negative offsets", () => {
    expect(
      createTimeOffsetDraft({
        days: 0,
        hours: 0,
        minutes: -1,
        seconds: 0,
        milliseconds: 0,
      }),
    ).toEqual({
      days: "-1",
      hours: "23",
      minutes: "59",
      seconds: "0",
      milliseconds: "0",
    });
  });
});
