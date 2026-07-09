import { describe, expect, it } from "vitest";
import {
  createTimestampRecognitionService,
  defaultTimestampFormats,
} from "../../src/timestamps/timestamp-recognition-service";

describe("timestamp recognition service", () => {
  it("uses the first suitable timestamp in a line when multiple formats match", () => {
    const service = createTimestampRecognitionService(defaultTimestampFormats);
    const line =
      "3.7.0.85728 95922 2026-07-09 13:17:21.701 DEBUG feed generation time: 2026-07-09T10:57:15.533Z";

    const match = service.recognizeTimestampInLine(line);

    expect(match?.formatId).toBe("space-dot");
    expect(match?.timestamp.toISOString()).toBe("2026-07-09T13:17:21.701Z");
    expect(line.slice(match?.sourceRange.start, match?.sourceRange.end)).toBe("2026-07-09 13:17:21.701");
  });

  it("recognizes the first timestamp even when it is not at the start of the line", () => {
    const service = createTimestampRecognitionService(defaultTimestampFormats);
    const line = "prefix value 2026-07-09T10:57:15.533Z message";

    const match = service.recognizeTimestampInLine(line);

    expect(match?.formatId).toBe("iso-utc");
    expect(match?.timestamp.toISOString()).toBe("2026-07-09T10:57:15.533Z");
    expect(match?.sourceRange.start).toBe(line.indexOf("2026-07-09T10:57:15.533Z"));
  });
});
