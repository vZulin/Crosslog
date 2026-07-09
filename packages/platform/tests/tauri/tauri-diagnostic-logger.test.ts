import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriDiagnosticLogger } from "../../src/tauri/tauri-diagnostic-logger";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("TauriDiagnosticLogger", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("delegates diagnostic log events to the desktop command", async () => {
    invokeMock.mockResolvedValue(undefined);
    const logger = new TauriDiagnosticLogger();
    const event = {
      timestamp: "2026-07-09T10:00:00.000Z",
      level: "info" as const,
      name: "desktop.pane.opened",
      fields: {
        paneId: "pane-1",
        path: "/tmp/app.log",
        activePaneCountAfter: 1,
      },
    };

    await logger.write(event);

    expect(invokeMock).toHaveBeenCalledWith("write_diagnostic_log", { event });
  });
});
