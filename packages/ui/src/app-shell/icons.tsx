import React from "react";

export const crosslogIconNames = [
  "add-pane",
  "bookmark",
  "caption-close",
  "caption-maximize",
  "caption-minimize",
  "close",
  "command-search",
  "drop-source",
  "file",
  "files",
  "filter",
  "folder",
  "live-dot",
  "next",
  "palette",
  "previous",
  "resize-boundary",
  "search",
  "settings",
  "source",
  "sync",
  "time-offset",
] as const;

export type CrosslogIconName = (typeof crosslogIconNames)[number];

export interface CrosslogIconProps extends Omit<React.SVGProps<SVGSVGElement>, "children"> {
  readonly title?: string;
}

interface NamedCrosslogIconProps extends CrosslogIconProps {
  readonly name: CrosslogIconName;
}

type IconComponent = (props: CrosslogIconProps) => React.JSX.Element;

export function CrosslogIcon({ name, ...props }: NamedCrosslogIconProps) {
  const Icon = iconComponents[name];

  return <Icon {...props} />;
}

export const iconComponents: Record<CrosslogIconName, IconComponent> = {
  "add-pane": AddPaneIcon,
  bookmark: BookmarkIcon,
  "caption-close": CaptionCloseIcon,
  "caption-maximize": CaptionMaximizeIcon,
  "caption-minimize": CaptionMinimizeIcon,
  close: CloseIcon,
  "command-search": SearchIcon,
  "drop-source": DropSourceIcon,
  file: FileIcon,
  files: FilesIcon,
  filter: FilterIcon,
  folder: FolderIcon,
  "live-dot": LiveDotIcon,
  next: NextIcon,
  palette: PaletteIcon,
  previous: PreviousIcon,
  "resize-boundary": ResizeBoundaryIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  source: SourceIcon,
  sync: SyncIcon,
  "time-offset": TimeOffsetIcon,
};

function SvgIcon({ title, children, ...props }: CrosslogIconProps & { readonly children: React.ReactNode }) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      fill="none"
      focusable="false"
      height="18"
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="18"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function AddPaneIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <rect height="16" rx="2.5" width="16" x="4" y="4" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </SvgIcon>
  );
}

function BookmarkIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 5.5A2.5 2.5 0 0 1 9.5 3h5A2.5 2.5 0 0 1 17 5.5V21l-5-3-5 3Z" />
    </SvgIcon>
  );
}

function CloseIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m7 7 10 10" />
      <path d="M17 7 7 17" />
    </SvgIcon>
  );
}

function CaptionCloseIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="m9.5 9.5 5 5" />
      <path d="m14.5 9.5-5 5" />
    </SvgIcon>
  );
}

function CaptionMaximizeIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <rect height="11" rx="1.8" width="11" x="6.5" y="6.5" />
    </SvgIcon>
  );
}

function CaptionMinimizeIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 12h10" />
    </SvgIcon>
  );
}

function DropSourceIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4v10" />
      <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
      <path d="M5 16.5v2.5h14v-2.5" />
    </SvgIcon>
  );
}

function FileIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v5h4" />
      <path d="M9.5 12h5" />
      <path d="M9.5 16h5" />
    </SvgIcon>
  );
}

function FilesIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 7V4h10v13h-3" />
      <path d="M4 7h10v13H4Z" />
      <path d="M6.5 11h5" />
      <path d="M6.5 15h5" />
    </SvgIcon>
  );
}

function FilterIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </SvgIcon>
  );
}

function FolderIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 6.5h6l2 2h9v9.5A2.5 2.5 0 0 1 18 20.5H6A2.5 2.5 0 0 1 3.5 18Z" />
    </SvgIcon>
  );
}

function LiveDotIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" fill="currentColor" r="4" stroke="none" />
    </SvgIcon>
  );
}

function NextIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m9 6 6 6-6 6" />
    </SvgIcon>
  );
}

function PaletteIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3a9 9 0 0 0 0 18h1.5a1.8 1.8 0 0 0 1.2-3.15 1.8 1.8 0 0 1 1.2-3.15H17a4 4 0 0 0 4-4C21 6.45 17 3 12 3Z" />
      <circle cx="8" cy="10" r="0.7" />
      <circle cx="11" cy="7.5" r="0.7" />
      <circle cx="15" cy="8.5" r="0.7" />
    </SvgIcon>
  );
}

function PreviousIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m15 6-6 6 6 6" />
    </SvgIcon>
  );
}

function ResizeBoundaryIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 4v16" />
      <path d="M14 4v16" />
      <path d="m6 9-3 3 3 3" />
      <path d="m18 9 3 3-3 3" />
    </SvgIcon>
  );
}

function SearchIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4 4" />
    </SvgIcon>
  );
}

function SettingsIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4" />
      <path d="M12 18.8v2.4" />
      <path d="m4.35 4.35 1.7 1.7" />
      <path d="m17.95 17.95 1.7 1.7" />
      <path d="M2.8 12h2.4" />
      <path d="M18.8 12h2.4" />
      <path d="m4.35 19.65 1.7-1.7" />
      <path d="m17.95 6.05 1.7-1.7" />
    </SvgIcon>
  );
}

function SourceIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h5.25L19 9.25v9.25a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5Z" />
      <path d="M12.5 3v6.5H19" />
      <path d="M8.5 14h7" />
      <path d="M8.5 17h5" />
    </SvgIcon>
  );
}

function SyncIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M18.2 11A6.5 6.5 0 0 0 7.1 6.4L4 9.5" />
      <path d="M5.8 13A6.5 6.5 0 0 0 16.9 17.6L20 14.5" />
    </SvgIcon>
  );
}

function TimeOffsetIcon(props: CrosslogIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
      <path d="M4 4 2.5 2.5" />
      <path d="M20 4 21.5 2.5" />
    </SvgIcon>
  );
}
