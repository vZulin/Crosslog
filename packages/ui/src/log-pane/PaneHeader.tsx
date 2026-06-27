import React from "react";
import type { DirectorySource, TimeOffset } from "@crosslog/core";
import { formatTimeOffset, getCurrentDirectoryFile } from "@crosslog/core";
import { ClosePaneButton } from "./ClosePaneButton";
import { DirectoryNavigator } from "./DirectoryNavigator";
import { EmptyDirectoryStatus } from "./EmptyDirectoryStatus";
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

  return (
    <header
      aria-current={active ? "true" : undefined}
      aria-label={`${headerLabel}${active ? " active pane" : ""}`}
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
