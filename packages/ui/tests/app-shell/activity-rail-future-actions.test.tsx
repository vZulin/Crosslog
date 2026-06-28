import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  canExecuteActivityRailItem,
  executeActivityRailAction,
  getActivityRailItems,
  isFutureActivityRailItem,
} from "../../src/app-shell/activityRailItems";
import { ActivityRail } from "../../src/app-shell/ActivityRail";
import { redesignedShellTestIds } from "../../src/app-shell/testIds";

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

  it("renders the target rail order and keeps future controls unavailable", () => {
    const onOpenSources = vi.fn();
    const onSearch = vi.fn();
    const { getAllByRole, getByTestId } = render(
      <ActivityRail onOpenSources={onOpenSources} onSearch={onSearch} />,
    );

    expect(getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Search logs",
      "Filters unavailable",
      "Highlighting unavailable",
      "Open sources",
      "Bookmarks unavailable",
      "Settings",
    ]);
    expect(getByTestId(redesignedShellTestIds.activityRailFilter).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailPalette).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailBookmark).hasAttribute("disabled")).toBe(true);

    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailFiles));
    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailSearch));
    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailFilter));

    expect(onOpenSources).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
