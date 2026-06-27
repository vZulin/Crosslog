import { describe, expect, it, vi } from "vitest";
import {
  canExecuteActivityRailItem,
  executeActivityRailAction,
  getActivityRailItems,
  isFutureActivityRailItem,
} from "../../src/app-shell/activityRailItems";

describe("activity rail future action guards", () => {
  it("keeps MVP rail items executable", () => {
    const action = vi.fn();
    const searchItem = getActivityRailItems().find((item) => item.id === "search");

    expect(searchItem).toBeDefined();
    expect(canExecuteActivityRailItem(searchItem!)).toBe(true);
    expect(executeActivityRailAction(searchItem!, action)).toBe(true);
    expect(action).toHaveBeenCalledWith(searchItem);
  });

  it("marks future rail items disabled and non-executable", () => {
    const action = vi.fn();
    const futureItems = getActivityRailItems().filter(isFutureActivityRailItem);

    expect(futureItems.map((item) => item.id)).toEqual(["filter", "palette", "bookmark"]);

    for (const item of futureItems) {
      expect(item.state).toBe("disabled");
      expect(canExecuteActivityRailItem(item)).toBe(false);
      expect(executeActivityRailAction(item, action)).toBe(false);
    }

    expect(action).not.toHaveBeenCalled();
  });

  it("can omit future controls where visible disabled controls would be misleading", () => {
    const items = getActivityRailItems({ includeFutureItems: false });

    expect(items.map((item) => item.id)).toEqual(["search", "files", "settings"]);
  });
});
