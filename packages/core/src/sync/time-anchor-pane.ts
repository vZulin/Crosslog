export type TimeAnchorSource = "scroll" | "search" | "directory-navigation";

export interface TimeAnchorPane {
  readonly paneId: string;
  readonly anchorTimestamp: Date;
  readonly source: TimeAnchorSource;
}

export function createTimeAnchorPane(
  paneId: string,
  anchorTimestamp: Date | null,
  source: TimeAnchorSource,
): TimeAnchorPane | null {
  if (!anchorTimestamp) {
    return null;
  }

  return {
    paneId,
    anchorTimestamp,
    source,
  };
}
