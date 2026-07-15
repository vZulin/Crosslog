import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSynchronizationStore } from "../../src/sync/useSynchronizationStore";

describe("synchronization store", () => {
  beforeEach(() => {
    useSynchronizationStore.getState().reset();
  });

  it("does not publish structurally unchanged synchronization plans", () => {
    const listener = vi.fn();
    const unsubscribe = useSynchronizationStore.subscribe(listener);
    const target = {
      paneId: "pane-b",
      lineNumber: 42,
      timestamp: new Date("2026-06-16T09:00:42.000Z"),
    };

    try {
      useSynchronizationStore.getState().setPlanResult([], [], null);
      expect(listener).not.toHaveBeenCalled();

      useSynchronizationStore.getState().setPlanResult([target], ["pane-untimed"], 3);
      expect(listener).toHaveBeenCalledTimes(1);
      const excludedPaneIds = useSynchronizationStore.getState().excludedPaneIds;

      useSynchronizationStore.getState().setPlanResult([target], ["pane-untimed"], 3);
      expect(listener).toHaveBeenCalledTimes(1);

      useSynchronizationStore.getState().setPlanResult([target], ["pane-untimed"], 4);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(useSynchronizationStore.getState().excludedPaneIds).toBe(excludedPaneIds);
    } finally {
      unsubscribe();
    }
  });
});
