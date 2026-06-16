import { describe, expect, it } from "vitest";
import { compileTimestampFormat } from "../../src/timestamps/timestamp-format";

describe("timestamp parser", () => {
  it("extracts and parses ISO timestamps with source ranges", () => {
    const format = compileTimestampFormat({
      id: "iso",
      pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z",
      parser: "YYYY-MM-DDTHH:mm:ss.SSSZ",
      enabled: true,
    });

    const match = format.matchLine("info 2026-06-16T09:15:30.125Z request completed");

    expect(match?.timestamp.toISOString()).toBe("2026-06-16T09:15:30.125Z");
    expect(match?.sourceRange).toEqual({ start: 5, end: 29 });
  });

  it("rejects impossible calendar values without throwing", () => {
    const format = compileTimestampFormat({
      id: "calendar",
      pattern: "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}",
      parser: "YYYY-MM-DD HH:mm:ss,SSS",
      enabled: true,
    });

    expect(format.matchLine("2026-02-31 10:00:00,000 invalid")).toBeNull();
  });

  it("fails fast for unsupported parser tokens", () => {
    expect(() =>
      compileTimestampFormat({
        id: "bad",
        pattern: "\\d+",
        parser: "YYYY/QQ/DD",
        enabled: true,
      }),
    ).toThrow(/Unsupported timestamp parser token/);
  });
});
