import { render, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  redesignedShellTestIds,
  type RedesignedShellTestId,
} from "../../src/app-shell/testIds";

const defaultPaneTitles = ["idea.log", "daemon-10770.log", "daemon-5365.log"] as const;
const longPaneTitles = [
  "prod-us-east-very-long-service-name-with-build-number-2026-06-27T09-20-11.123Z.log",
  "directory-with-a-very-long-name/currently-selected-log-file-with-extra-context-and-timestamp.log",
  "observability-ingest-worker-shard-003-archive-rotation-output.log",
] as const;

export type RedesignedShellFixtureWorkspaceState = "populated" | "empty";
export type RedesignedShellFixtureThemeVariant = "light" | "dark";
export type RedesignedShellFixturePlatformVariant = "macos" | "windows" | "linux" | "web";

export interface RenderRedesignedShellOptions {
  readonly paneTitles?: readonly string[];
  readonly workspaceState?: RedesignedShellFixtureWorkspaceState;
  readonly activeSource?: string;
  readonly syncEnabled?: boolean;
  readonly themeVariant?: RedesignedShellFixtureThemeVariant;
  readonly platformVariant?: RedesignedShellFixturePlatformVariant;
  readonly useLongPaneTitles?: boolean;
  readonly includeResizeBoundary?: boolean;
  readonly includeSearchPopover?: boolean;
  readonly includeTimeOffsetPopover?: boolean;
  readonly statusMessage?: string;
}

export interface RenderedRedesignedShell extends RenderResult {
  readonly testIds: typeof redesignedShellTestIds;
  readonly getRegion: (testId: RedesignedShellTestId) => HTMLElement;
}

export function renderRedesignedShell(
  options: RenderRedesignedShellOptions = {},
): RenderedRedesignedShell {
  const paneTitles =
    options.workspaceState === "empty"
      ? []
      : options.paneTitles ?? (options.useLongPaneTitles ? longPaneTitles : defaultPaneTitles);
  const activeSource = options.activeSource ?? paneTitles[0] ?? "none";
  const syncState = options.syncEnabled ?? true;
  const themeVariant = options.themeVariant ?? "light";
  const platformVariant = options.platformVariant ?? "macos";
  const hasPanes = paneTitles.length > 0;
  const statusMessage =
    options.statusMessage ??
    `${paneTitles.length} panes, sync ${syncState ? "on" : "off"}, active: ${activeSource}`;

  const result = render(
    <RedesignedShellFixture
      activeSource={activeSource}
      includeResizeBoundary={options.includeResizeBoundary ?? paneTitles.length > 1}
      includeSearchPopover={options.includeSearchPopover ?? hasPanes}
      includeTimeOffsetPopover={options.includeTimeOffsetPopover ?? hasPanes}
      paneTitles={paneTitles}
      platformVariant={platformVariant}
      statusMessage={statusMessage}
      syncEnabled={syncState}
      themeVariant={themeVariant}
    />,
  );

  return {
    ...result,
    testIds: redesignedShellTestIds,
    getRegion: (testId) => result.getByTestId(testId),
  };
}

interface RedesignedShellFixtureProps {
  readonly paneTitles: readonly string[];
  readonly activeSource: string;
  readonly syncEnabled: boolean;
  readonly themeVariant: RedesignedShellFixtureThemeVariant;
  readonly platformVariant: RedesignedShellFixturePlatformVariant;
  readonly includeResizeBoundary: boolean;
  readonly includeSearchPopover: boolean;
  readonly includeTimeOffsetPopover: boolean;
  readonly statusMessage: string;
}

function RedesignedShellFixture({
  paneTitles,
  activeSource,
  syncEnabled,
  themeVariant,
  platformVariant,
  includeResizeBoundary,
  includeSearchPopover,
  includeTimeOffsetPopover,
  statusMessage,
}: RedesignedShellFixtureProps) {
  return (
    <main
      aria-label="Crosslog workspace"
      data-platform={platformVariant}
      data-testid={redesignedShellTestIds.crosslogShell}
      data-theme={themeVariant}
    >
      <span hidden data-testid={redesignedShellTestIds.themeVariant}>
        {themeVariant}
      </span>
      <PlatformChromeFixture platformVariant={platformVariant} />
      <section aria-label="Topbar" data-testid={redesignedShellTestIds.topbar}>
        <label>
          Command or workspace search
          <input data-testid={redesignedShellTestIds.commandField} type="search" />
        </label>
        <button
          aria-pressed={syncEnabled}
          data-testid={redesignedShellTestIds.topbarSync}
          type="button"
        >
          Sync
        </button>
        <button data-testid={redesignedShellTestIds.topbarAddPane} type="button">
          Add pane
        </button>
      </section>

      <nav aria-label="Activity rail" data-testid={redesignedShellTestIds.activityRail}>
        {activityRailButtons}
      </nav>

      <section aria-label="Pane workspace" data-testid={redesignedShellTestIds.paneWorkspace}>
        {paneTitles.length === 0 ? (
          <EmptyWorkspaceFixture />
        ) : (
          <>
            {paneTitles.map((title, index) => (
              <article
                aria-label={`Log pane ${title}`}
                data-active={title === activeSource ? "true" : "false"}
                data-testid={redesignedShellTestIds.logPane}
                key={title}
              >
                <PaneHeaderFixture title={title} />
                <ol
                  aria-label={`Virtual log viewport for ${title}`}
                  data-testid={redesignedShellTestIds.logViewport}
                >
                  <li>2026-06-09 11:15:13.859 INFO Project opened workspace=Crosslog</li>
                </ol>
                {includeResizeBoundary && index < paneTitles.length - 1 ? (
                  <ResizeBoundaryFixture />
                ) : null}
              </article>
            ))}
            <div aria-hidden data-testid={redesignedShellTestIds.workspaceScrollbar}>
              <div data-testid={redesignedShellTestIds.workspaceScrollbarThumb} />
            </div>
          </>
        )}
      </section>

      {includeTimeOffsetPopover ? <TimeOffsetPopoverFixture activeSource={activeSource} /> : null}
      {includeSearchPopover ? <PaneSearchPopoverFixture /> : null}

      <footer aria-label="Workspace status" data-testid={redesignedShellTestIds.statusBar}>
        {statusMessage}
      </footer>
    </main>
  );
}

function PlatformChromeFixture({
  platformVariant,
}: {
  readonly platformVariant: RedesignedShellFixturePlatformVariant;
}) {
  return (
    <section
      aria-label={`${platformVariant} shell chrome`}
      data-platform={platformVariant}
      data-testid={redesignedShellTestIds.platformChrome}
    >
      <span data-testid={redesignedShellTestIds.platformChromeTitle}>Crosslog</span>
      {platformVariant === "macos" ? (
        <span
          aria-label="macOS traffic lights"
          data-testid={redesignedShellTestIds.platformChromeMacosTrafficLights}
        />
      ) : null}
      {platformVariant === "windows" ? (
        <span
          aria-label="Windows caption controls"
          data-testid={redesignedShellTestIds.platformChromeWindowsCaptionControls}
        />
      ) : null}
      {platformVariant === "linux" ? (
        <span
          aria-label="Linux caption controls"
          data-testid={redesignedShellTestIds.platformChromeLinuxCaptionControls}
        />
      ) : null}
      {platformVariant === "web" ? (
        <span
          aria-label="Web shell title"
          data-testid={redesignedShellTestIds.platformChromeWebTitle}
        />
      ) : null}
    </section>
  );
}

function EmptyWorkspaceFixture() {
  return (
    <section aria-label="Empty workspace" data-testid={redesignedShellTestIds.emptyWorkspace}>
      <div aria-label="Drop log sources" data-testid={redesignedShellTestIds.emptyDropZone}>
        <button data-testid={redesignedShellTestIds.emptyOpenSource} type="button">
          Open Source
        </button>
      </div>
    </section>
  );
}

function ResizeBoundaryFixture() {
  return (
    <div
      aria-label="Resize panes"
      aria-orientation="vertical"
      data-testid={redesignedShellTestIds.paneResizeBoundary}
      role="separator"
    />
  );
}

function PaneHeaderFixture({ title }: { readonly title: string }) {
  return (
    <header data-testid={redesignedShellTestIds.paneHeader}>
      <h2>{title}</h2>
      <button data-testid={redesignedShellTestIds.paneHeaderOffset} type="button">
        +0000-00-00 00:00:00.000
      </button>
      <button data-testid={redesignedShellTestIds.paneHeaderSearch} type="button">
        Search in {title}
      </button>
      <button data-testid={redesignedShellTestIds.paneHeaderClose} type="button">
        Close {title}
      </button>
    </header>
  );
}

function TimeOffsetPopoverFixture({ activeSource }: { readonly activeSource: string }) {
  return (
    <section
      aria-label={`Time Offset for ${activeSource}`}
      data-testid={redesignedShellTestIds.timeOffsetPopover}
    >
      <OffsetInput label="Days" testId={redesignedShellTestIds.timeOffsetDays} />
      <OffsetInput label="Hours" testId={redesignedShellTestIds.timeOffsetHours} />
      <OffsetInput label="Minutes" testId={redesignedShellTestIds.timeOffsetMinutes} />
      <OffsetInput label="Seconds" testId={redesignedShellTestIds.timeOffsetSeconds} />
      <OffsetInput label="Milliseconds" testId={redesignedShellTestIds.timeOffsetMilliseconds} />
      <button data-testid={redesignedShellTestIds.timeOffsetApply} type="button">
        Apply
      </button>
    </section>
  );
}

function OffsetInput({
  label,
  testId,
}: {
  readonly label: string;
  readonly testId: RedesignedShellTestId;
}) {
  return (
    <label>
      {label}
      <input data-testid={testId} type="number" defaultValue={0} />
    </label>
  );
}

function PaneSearchPopoverFixture() {
  return (
    <section aria-label="Pane search" data-testid={redesignedShellTestIds.paneSearchPopover}>
      <input aria-label="Search" data-testid={redesignedShellTestIds.paneSearchField} type="search" />
      <button data-testid={redesignedShellTestIds.paneSearchPrevious} type="button">
        Previous match
      </button>
      <button data-testid={redesignedShellTestIds.paneSearchNext} type="button">
        Next match
      </button>
      <button data-testid={redesignedShellTestIds.paneSearchCaseSensitive} type="button">
        Aa
      </button>
      <button data-testid={redesignedShellTestIds.paneSearchRegex} type="button">
        .*
      </button>
      <span data-testid={redesignedShellTestIds.paneSearchMatchCount}>4/12</span>
    </section>
  );
}

const activityRailButtons: ReactNode = (
  <>
    <button data-testid={redesignedShellTestIds.activityRailSearch} type="button">
      Search
    </button>
    <button aria-disabled="true" data-testid={redesignedShellTestIds.activityRailFilter} type="button">
      Filter unavailable
    </button>
    <button aria-disabled="true" data-testid={redesignedShellTestIds.activityRailPalette} type="button">
      Highlighting unavailable
    </button>
    <button data-testid={redesignedShellTestIds.activityRailFiles} type="button">
      Files
    </button>
    <button
      aria-disabled="true"
      data-testid={redesignedShellTestIds.activityRailBookmark}
      type="button"
    >
      Bookmarks unavailable
    </button>
    <button data-testid={redesignedShellTestIds.activityRailSettings} type="button">
      Settings
    </button>
  </>
);
