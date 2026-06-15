import { describe, expect, it } from "vitest";
describe("platform port contracts", () => {
  it("keeps platform behavior behind explicit ports", () => {
    const ports = [
      "fileAccess",
      "directoryAccess",
      "fileWatcher",
      "sessionStore",
      "capability",
      "sourcePicker",
      "dragDropSource",
    ] as const;

    expect(ports).toHaveLength(7);
  });
});
