import { bench, describe } from "vitest";
import { createVisibleLogLineWindow } from "../../packages/ui/src/log-pane/VirtualLogViewport";
import { large20MbLogFixture } from "../fixtures/large-20mb-log.fixture";

describe("log pane virtualization", () => {
  bench("creates a bounded render window for large logs", () => {
    const lineCount = 100_000;
    const lines = Array.from({ length: lineCount }, (_, index) => `line ${index} ${large20MbLogFixture.fileName}`);
    const visibleLines = createVisibleLogLineWindow(lines, 120);

    if (visibleLines.length !== 120 || visibleLines[0]?.lineNumber !== 1) {
      throw new Error("Virtual viewport produced an invalid render window.");
    }
  });
});
