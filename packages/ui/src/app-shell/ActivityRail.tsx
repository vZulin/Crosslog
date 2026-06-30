import React from "react";
import {
  executeActivityRailAction,
  getActivityRailItems,
  type ActivityRailItem,
  type ActivityRailItemId,
} from "./activityRailItems";
import { IconButton } from "./IconButton";

export interface ActivityRailProps {
  readonly activeItemId?: ActivityRailItemId | null;
  readonly onOpenSources?: () => void;
  readonly onSearch?: () => void;
  readonly onSettings?: () => void;
  readonly settingsButtonRef?: React.Ref<HTMLButtonElement>;
}

export function ActivityRail({
  activeItemId = null,
  onOpenSources,
  onSearch,
  onSettings,
  settingsButtonRef,
}: ActivityRailProps) {
  const items = getActivityRailItems({ activeItemId });

  return (
    <div className="crosslog-activity-rail">
      {items.map((item) => (
        <IconButton
          active={item.state === "active"}
          icon={item.icon}
          key={item.id}
          label={item.label}
          onClick={() => executeActivityRailAction(item, () => runRailAction(item, { onOpenSources, onSearch, onSettings }))}
          ref={item.id === "settings" ? settingsButtonRef : undefined}
          testId={item.testId}
          tooltip={item.unavailableReason ?? item.label}
          unavailable={item.state === "disabled"}
        />
      ))}
    </div>
  );
}

interface ActivityRailHandlers {
  readonly onOpenSources?: () => void;
  readonly onSearch?: () => void;
  readonly onSettings?: () => void;
}

function runRailAction(item: ActivityRailItem, handlers: ActivityRailHandlers): void {
  switch (item.id) {
    case "files":
      handlers.onOpenSources?.();
      return;
    case "search":
      handlers.onSearch?.();
      return;
    case "settings":
      handlers.onSettings?.();
      return;
    case "bookmark":
    case "filter":
    case "palette":
      return;
  }
}
