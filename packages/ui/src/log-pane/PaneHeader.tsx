import React from "react";
import type { DirectorySource, TimeOffset } from "@crosslog/core";
import { formatTimeOffset, getCurrentDirectoryFile } from "@crosslog/core";
import { ClosePaneButton } from "./ClosePaneButton";
import { DirectoryNavigator } from "./DirectoryNavigator";
import { EmptyDirectoryStatus } from "./EmptyDirectoryStatus";
import type { PaneHeaderLifecycleState } from "./useFileLifecycleEvents";
import { CrosslogIcon } from "../app-shell/icons";
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
  readonly searchButtonRef?: React.Ref<HTMLButtonElement>;
  readonly timeOffsetButtonRef?: React.Ref<HTMLButtonElement>;
  readonly reorderDragging?: boolean;
  readonly onClose: () => void;
  readonly onReorderDragStart?: React.PointerEventHandler<HTMLElement>;
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
  searchButtonRef,
  timeOffsetButtonRef,
  reorderDragging = false,
  onClose,
  onReorderDragStart,
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
  const liveIndicator = lifecycleIndicators.find((indicator) => indicator.kind === "live");
  const visibleLifecycleIndicators = lifecycleIndicators.filter((indicator) => indicator.kind !== "live");
  const lifecycleLabel =
    lifecycleIndicators.length > 0
      ? `, file state ${lifecycleIndicators.map((indicator) => indicator.label).join(", ")}`
      : "";
  const handleHeaderPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!onReorderDragStart || isPaneHeaderInteractiveControl(event.target)) {
        return;
      }

      onReorderDragStart(event);
    },
    [onReorderDragStart],
  );

  return (
    <header
      aria-current={active ? "true" : undefined}
      aria-label={`${headerLabel}${active ? " active pane" : ""}${lifecycleLabel}`}
      className="crosslog-pane-header"
      data-active={active ? "true" : "false"}
      data-reorder-dragging={reorderDragging ? "true" : "false"}
      data-testid={redesignedShellTestIds.paneHeader}
      id={redesignedShellTestIds.paneHeader}
      onPointerDown={handleHeaderPointerDown}
    >
      <div className={identityClassName}>
        {directorySource ? (
          <>
            <span className="crosslog-pane-header__title-row crosslog-pane-header__title-row--directory">
              <CrosslogIcon className="crosslog-pane-header__identity-icon" name="folder" />
              <span
                className="crosslog-pane-header__directory"
                data-testid={redesignedShellTestIds.paneHeaderDirectoryTitle}
                title={directorySource.displayName}
              >
                {directorySource.displayName}
              </span>
              {!selectedFile && visibleLifecycleIndicators.length > 0 ? (
                <LifecycleBadgeGroup indicators={visibleLifecycleIndicators} />
              ) : null}
            </span>
            {selectedFile ? (
              <span className="crosslog-pane-header__title-row crosslog-pane-header__title-row--selected-file">
                <CrosslogIcon className="crosslog-pane-header__identity-icon" name="file" />
                <h2
                  className="crosslog-pane-header__title crosslog-pane-header__selected-file"
                  data-testid={redesignedShellTestIds.paneHeaderSelectedFile}
                  title={displayTitle}
                >
                  {displayTitle}
                </h2>
                {liveIndicator ? <LiveLifecycleIndicator indicator={liveIndicator} /> : null}
                {visibleLifecycleIndicators.length > 0 ? (
                  <LifecycleBadgeGroup indicators={visibleLifecycleIndicators} />
                ) : null}
              </span>
            ) : null}
            {directorySource.files.length === 0 ? (
              <EmptyDirectoryStatus directoryName={directorySource.displayName} />
            ) : null}
          </>
        ) : (
          <span className="crosslog-pane-header__title-row crosslog-pane-header__title-row--file">
            <CrosslogIcon className="crosslog-pane-header__identity-icon" name="file" />
            <h2 className="crosslog-pane-header__title" title={displayTitle}>
              {displayTitle}
            </h2>
            {liveIndicator ? <LiveLifecycleIndicator indicator={liveIndicator} /> : null}
            {visibleLifecycleIndicators.length > 0 ? (
              <LifecycleBadgeGroup indicators={visibleLifecycleIndicators} />
            ) : null}
          </span>
        )}
        {lifecycleIndicators.length > 0 ? (
          <LifecycleStatus indicators={lifecycleIndicators} title={displayTitle} />
        ) : null}
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
      <div className="crosslog-pane-header__actions">
        <button
          aria-expanded={timeOffsetOpen}
          aria-haspopup="dialog"
          aria-label={`Time offset for ${displayTitle}: ${offsetLabel}`}
          className="crosslog-pane-header__offset-tag"
          data-testid={redesignedShellTestIds.paneHeaderOffset}
          onClick={onOpenTimeOffset}
          ref={timeOffsetButtonRef}
          type="button"
        >
          <span className="crosslog-sr-only">Offset </span>
          {offsetLabel}
        </button>
        <IconButton
          aria-expanded={searchOpen}
          aria-haspopup="dialog"
          className="crosslog-pane-header__find-button"
          icon="search"
          label={`Search in ${displayTitle}`}
          onClick={onOpenSearch}
          pressed={searchOpen}
          ref={searchButtonRef}
          testId={redesignedShellTestIds.paneHeaderSearch}
        />
      </div>
      <ClosePaneButton
        className="crosslog-pane-header__close"
        testId={redesignedShellTestIds.paneHeaderClose}
        title={displayTitle}
        onClose={onClose}
      />
    </header>
  );
}

const interactiveHeaderControlSelector = [
  "a[href]",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "button",
].join(",");

function isPaneHeaderInteractiveControl(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(interactiveHeaderControlSelector));
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

function LiveLifecycleIndicator({ indicator }: { readonly indicator: LifecycleIndicator }) {
  return (
    <span
      aria-hidden="true"
      className="crosslog-pane-header__live-indicator"
      data-testid={indicator.testId}
      title={indicator.description}
    >
      <span className="crosslog-pane-header__live-dot" />
    </span>
  );
}

function LifecycleStatus({
  indicators,
  title,
}: {
  readonly indicators: readonly LifecycleIndicator[];
  readonly title: string;
}) {
  return (
    <span
      aria-label={`File state for ${title}: ${indicators.map((indicator) => indicator.label).join(", ")}`}
      className="crosslog-pane-header__lifecycle-status"
      data-testid={redesignedShellTestIds.paneHeaderLifecycle}
      role="status"
    >
      {indicators.map((indicator) => indicator.label).join(", ")}
    </span>
  );
}

function LifecycleBadge({ indicator }: { readonly indicator: LifecycleIndicator }) {
  return (
    <span
      className={`crosslog-pane-header__lifecycle-badge crosslog-pane-header__lifecycle-badge--${indicator.kind}`}
      data-testid={indicator.testId}
      title={indicator.description}
    >
      {indicator.label}
    </span>
  );
}

function LifecycleBadgeGroup({ indicators }: { readonly indicators: readonly LifecycleIndicator[] }) {
  return (
    <span className="crosslog-pane-header__lifecycle-badges">
      {indicators.map((indicator) => (
        <LifecycleBadge indicator={indicator} key={indicator.kind} />
      ))}
    </span>
  );
}
