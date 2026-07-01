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
  it("keeps Settings executable as the remaining MVP rail item for this phase", () => {
    const action = vi.fn();
    const settingsItem = getActivityRailItems().find((item) => item.id === "settings");

    expect(settingsItem).toBeDefined();
    expect(canExecuteActivityRailItem(settingsItem!)).toBe(true);
    expect(executeActivityRailAction(settingsItem!, action)).toBe(true);
    expect(action).toHaveBeenCalledWith(settingsItem);
  });

  it("marks future and unavailable rail items disabled and non-executable", () => {
    const action = vi.fn();
    const futureItems = getActivityRailItems().filter(isFutureActivityRailItem);

    expect(futureItems.map((item) => item.id)).toEqual(["search", "filter", "palette", "files", "bookmark"]);

    for (const item of futureItems) {
      expect(item.state).toBe("disabled");
      expect(canExecuteActivityRailItem(item)).toBe(false);
      expect(executeActivityRailAction(item, action)).toBe(false);
    }

    expect(action).not.toHaveBeenCalled();
  });

  it("can omit future controls where visible disabled controls would be misleading", () => {
    const items = getActivityRailItems({ includeFutureItems: false });

    expect(items.map((item) => item.id)).toEqual(["settings"]);
  });

  it("renders the target rail order and keeps unavailable controls inert", () => {
    const onOpenSources = vi.fn();
    const onSearch = vi.fn();
    const onSettings = vi.fn();
    const { getAllByRole, getByTestId } = render(
      <ActivityRail onOpenSources={onOpenSources} onSearch={onSearch} onSettings={onSettings} />,
    );

    expect(getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Search logs",
      "Filters unavailable",
      "Highlighting unavailable",
      "Open sources",
      "Bookmarks unavailable",
      "Settings",
    ]);
    expect(getByTestId(redesignedShellTestIds.activityRailSearch).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailFiles).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailFilter).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailPalette).hasAttribute("disabled")).toBe(true);
    expect(getByTestId(redesignedShellTestIds.activityRailBookmark).hasAttribute("disabled")).toBe(true);

    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailFiles));
    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailSearch));
    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailFilter));
    fireEvent.click(getByTestId(redesignedShellTestIds.activityRailSettings));

    expect(onOpenSources).not.toHaveBeenCalled();
    expect(onSearch).not.toHaveBeenCalled();
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
