import { redesignedShellTestIds, type RedesignedShellTestId } from "./testIds";
import type { CrosslogIconName } from "./icons";

export type ActivityRailItemId = "search" | "filter" | "palette" | "files" | "bookmark" | "settings";
export type ActivityRailItemCapability = "mvp" | "future";
export type ActivityRailItemState = "enabled" | "active" | "disabled" | "hidden";

export interface ActivityRailItem {
  readonly id: ActivityRailItemId;
  readonly label: string;
  readonly icon: CrosslogIconName;
  readonly capability: ActivityRailItemCapability;
  readonly state: ActivityRailItemState;
  readonly testId: RedesignedShellTestId;
  readonly unavailableReason?: string;
}

export interface ActivityRailItemOptions {
  readonly activeItemId?: ActivityRailItemId | null;
  readonly includeFutureItems?: boolean;
}

export type ActivityRailAction = (item: ActivityRailItem) => void;

const activityRailItemDefinitions = [
  {
    id: "search",
    label: "Search logs",
    icon: "search",
    capability: "mvp",
    testId: redesignedShellTestIds.activityRailSearch,
  },
  {
    id: "filter",
    label: "Filters unavailable",
    icon: "filter",
    capability: "future",
    testId: redesignedShellTestIds.activityRailFilter,
    unavailableReason: "Filtering is outside the MVP scope.",
  },
  {
    id: "palette",
    label: "Highlighting unavailable",
    icon: "palette",
    capability: "future",
    testId: redesignedShellTestIds.activityRailPalette,
    unavailableReason: "User-configurable highlighting is outside the MVP scope.",
  },
  {
    id: "files",
    label: "Open sources",
    icon: "files",
    capability: "mvp",
    testId: redesignedShellTestIds.activityRailFiles,
  },
  {
    id: "bookmark",
    label: "Bookmarks unavailable",
    icon: "bookmark",
    capability: "future",
    testId: redesignedShellTestIds.activityRailBookmark,
    unavailableReason: "Bookmarks and saved filters are outside the MVP scope.",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    capability: "mvp",
    testId: redesignedShellTestIds.activityRailSettings,
  },
] as const satisfies readonly Omit<ActivityRailItem, "state">[];

export function getActivityRailItems({
  activeItemId = null,
  includeFutureItems = true,
}: ActivityRailItemOptions = {}): readonly ActivityRailItem[] {
  return activityRailItemDefinitions
    .filter((item) => includeFutureItems || item.capability === "mvp")
    .map((item) => ({
      ...item,
      state: getActivityRailItemState(item.id, item.capability, activeItemId),
    }));
}

export function canExecuteActivityRailItem(item: ActivityRailItem): boolean {
  return item.capability === "mvp" && (item.state === "enabled" || item.state === "active");
}

export function executeActivityRailAction(item: ActivityRailItem, action: ActivityRailAction): boolean {
  if (!canExecuteActivityRailItem(item)) {
    return false;
  }

  action(item);
  return true;
}

export function isFutureActivityRailItem(item: ActivityRailItem): boolean {
  return item.capability === "future";
}

function getActivityRailItemState(
  itemId: ActivityRailItemId,
  capability: ActivityRailItemCapability,
  activeItemId: ActivityRailItemId | null,
): ActivityRailItemState {
  if (capability === "future") {
    return "disabled";
  }

  return itemId === activeItemId ? "active" : "enabled";
}
