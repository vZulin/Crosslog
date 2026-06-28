import React from "react";
import type { DirectorySource, TimeOffset } from "@crosslog/core";
import { formatTimeOffset, getCurrentDirectoryFile } from "@crosslog/core";
import { ClosePaneButton } from "./ClosePaneButton";
import { DirectoryNavigator } from "./DirectoryNavigator";
import { EmptyDirectoryStatus } from "./EmptyDirectoryStatus";
import type { PaneHeaderLifecycleState } from "./useFileLifecycleEvents";
import { IconButton } from "../app-shell/IconButton";
import { redesignedShellTestIds } from "../app-shell/testIds";

export interface PaneHeaderProps {
  readonly paneId: string;
  readonly title: string;
  readonly active: boolean;
  readonly timeOffset: TimeOffset;
  readonly searchOpen?: boolean;
  readonly timeOffsetOpen?: boolean;
  readonly directorySource?: DirectorySource;
  readonly lifecycleState?: PaneHeaderLifecycleState;
  readonly onClose: () => void;
  readonly onOpenSearch?: () => void;
  readonly onOpenTimeOffset?: () => void;
  readonly onNavigateDirectory?: (paneId: string, direction: "previous" | "next") => void;
}

export function PaneHeader({
  active,
  paneId,
  title,
  timeOffset,
  searchOpen = false,
  timeOffsetOpen = false,
  directorySource,
  lifecycleState,
  onClose,
  onOpenSearch,
  onOpenTimeOffset,
  onNavigateDirectory,
}: PaneHeaderProps) {
  const selectedFile = directorySource ? getCurrentDirectoryFile(directorySource) : null;
  const previousFile = directorySource
    ? directorySource.files.find((entry) => entry.identity.value === directorySource.navigationIndex.previousFileId) ?? null
    : null;
  const nextFile = directorySource
    ? directorySource.files.find((entry) => entry.identity.value === directorySource.navigationIndex.nextFileId) ?? null
    : null;
  const displayTitle = directorySource ? selectedFile?.name ?? directorySource.displayName : title;
  const headerLabel = directorySource
    ? selectedFile
      ? `${directorySource.displayName}, selected file ${selectedFile.name}`
      : `${directorySource.displayName}, empty directory`
    : displayTitle;
  const identityClassName = [
    "crosslog-pane-header__identity",
    directorySource ? "crosslog-pane-header__identity--directory" : null,
  ].filter(Boolean).join(" ");
  const offsetLabel = formatTimeOffset(timeOffset);
  const lifecycleIndicators = getLifecycleIndicators(lifecycleState);
  const lifecycleLabel =
    lifecycleIndicators.length > 0
      ? `, file state ${lifecycleIndicators.map((indicator) => indicator.label).join(", ")}`
      : "";

  return (
    <header
      aria-current={active ? "true" : undefined}
      aria-label={`${headerLabel}${active ? " active pane" : ""}${lifecycleLabel}`}
      className="crosslog-pane-header"
      data-active={active ? "true" : "false"}
      data-testid={redesignedShellTestIds.paneHeader}
      id={redesignedShellTestIds.paneHeader}
    >
      <div className={identityClassName}>
        {directorySource ? (
          <>
            <span
              className="crosslog-pane-header__directory"
              data-testid={redesignedShellTestIds.paneHeaderDirectoryTitle}
              title={directorySource.displayName}
            >
              {directorySource.displayName}
            </span>
            <h2
              className={[
                "crosslog-pane-header__title",
                selectedFile ? "crosslog-pane-header__selected-file" : null,
              ].filter(Boolean).join(" ")}
              data-testid={selectedFile ? redesignedShellTestIds.paneHeaderSelectedFile : undefined}
              title={displayTitle}
            >
              {displayTitle}
            </h2>
            {directorySource.files.length === 0 ? (
              <EmptyDirectoryStatus directoryName={directorySource.displayName} />
            ) : null}
          </>
        ) : (
          <h2 className="crosslog-pane-header__title" title={displayTitle}>
            {displayTitle}
          </h2>
        )}
      </div>
      {directorySource && directorySource.files.length > 0 ? (
        <DirectoryNavigator
          directoryName={directorySource.displayName}
          selectedFileName={selectedFile?.name ?? null}
          previousFileName={previousFile?.name ?? null}
          nextFileName={nextFile?.name ?? null}
          onPrevious={() => onNavigateDirectory?.(paneId, "previous")}
          onNext={() => onNavigateDirectory?.(paneId, "next")}
        />
      ) : null}
      {lifecycleIndicators.length > 0 ? (
        <div
          aria-label={`File state for ${displayTitle}: ${lifecycleIndicators.map((indicator) => indicator.label).join(", ")}`}
          className="crosslog-pane-header__lifecycle"
          data-testid={redesignedShellTestIds.paneHeaderLifecycle}
          role="status"
        >
          {lifecycleIndicators.map((indicator) => (
            <span
              className={`crosslog-pane-header__lifecycle-badge crosslog-pane-header__lifecycle-badge--${indicator.kind}`}
              data-testid={indicator.testId}
              key={indicator.kind}
              title={indicator.description}
            >
              {indicator.kind === "live" ? (
                <>
                  <span aria-hidden="true" className="crosslog-pane-header__live-dot" />
                  <span className="crosslog-sr-only">{indicator.label}</span>
                </>
              ) : (
                indicator.label
              )}
            </span>
          ))}
        </div>
      ) : null}
      <div className="crosslog-pane-header__actions">
        <button
          aria-expanded={timeOffsetOpen}
          aria-haspopup="dialog"
          aria-label={`Time offset for ${displayTitle}: ${offsetLabel}`}
          className="crosslog-pane-header__offset-tag"
          data-testid={redesignedShellTestIds.paneHeaderOffset}
          onClick={onOpenTimeOffset}
          type="button"
        >
          Offset {offsetLabel}
        </button>
        <IconButton
          aria-expanded={searchOpen}
          aria-haspopup="dialog"
          icon="search"
          label={`Search in ${displayTitle}`}
          onClick={onOpenSearch}
          pressed={searchOpen}
          testId={redesignedShellTestIds.paneHeaderSearch}
        />
        <ClosePaneButton
          testId={redesignedShellTestIds.paneHeaderClose}
          title={displayTitle}
          onClose={onClose}
        />
      </div>
    </header>
  );
}

interface LifecycleIndicator {
  readonly kind: "live" | "deleted" | "replaced" | "unsupported" | "error";
  readonly label: string;
  readonly description: string;
  readonly testId: string;
}

function getLifecycleIndicators(
  lifecycleState: PaneHeaderLifecycleState | undefined,
): readonly LifecycleIndicator[] {
  if (!lifecycleState) {
    return [];
  }

  const indicators: LifecycleIndicator[] = [];

  if (lifecycleState.errorMessage) {
    indicators.push({
      kind: "error",
      label: "Error",
      description: lifecycleState.errorMessage,
      testId: redesignedShellTestIds.paneHeaderError,
    });
  }

  if (lifecycleState.deleted) {
    indicators.push({
      kind: "deleted",
      label: "Deleted",
      description: "Loaded content is retained.",
      testId: redesignedShellTestIds.paneHeaderDeleted,
    });
  }

  if (lifecycleState.replaced) {
    indicators.push({
      kind: "replaced",
      label: "Replaced",
      description: "Replacement content is shown in this pane.",
      testId: redesignedShellTestIds.paneHeaderReplaced,
    });
  }

  if (lifecycleState.monitoringUnsupported) {
    indicators.push({
      kind: "unsupported",
      label: "Monitoring unavailable",
      description: "This platform cannot watch the file for changes.",
      testId: redesignedShellTestIds.paneHeaderMonitoringUnsupported,
    });
  }

  if (lifecycleState.live) {
    indicators.push({
      kind: "live",
      label: "Live",
      description: "Live updates are active.",
      testId: redesignedShellTestIds.paneHeaderLive,
    });
  }

  return indicators;
}
