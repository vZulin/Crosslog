import { describe, expect, it } from "vitest";
import { loadTimestampConfigFromJson, validateTimestampConfig } from "../../src/timestamps/timestamp-config";

describe("timestamp config", () => {
  it("loads enabled timestamp formats from read-only JSON content", () => {
    const config = loadTimestampConfigFromJson(
      JSON.stringify({
        formats: [
          {
            id: "iso",
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z",
            parser: "YYYY-MM-DDTHH:mm:ss.SSSZ",
          },
          {
            id: "disabled",
            pattern: "\\d+",
            parser: "YYYY",
            enabled: false,
          },
        ],
      }),
    );

    expect(config.formats).toHaveLength(2);
    expect(validateTimestampConfig(config).enabledFormats.map((format) => format.id)).toEqual(["iso"]);
  });

  it("reports duplicate ids and invalid patterns as config errors", () => {
    expect(() =>
      validateTimestampConfig({
        formats: [
          { id: "dup", pattern: "(", parser: "YYYY", enabled: true },
          { id: "dup", pattern: "\\d{4}", parser: "YYYY", enabled: true },
        ],
      }),
    ).toThrow(/Duplicate timestamp format id|Invalid timestamp pattern/);
  });
});
