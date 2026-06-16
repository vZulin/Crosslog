import React from "react";
import type { LogPane as LogPaneModel } from "@crosslog/core";
import { ClosePaneButton } from "./ClosePaneButton";
import { HorizontalLogScroller } from "./HorizontalLogScroller";
import { LogTextSelection } from "./LogTextSelection";
import { VirtualLogViewport } from "./VirtualLogViewport";

export interface LogPaneProps {
  readonly pane: LogPaneModel;
  readonly lines: readonly string[];
  readonly directoryLabel?: string;
  readonly onClose: (paneId: string) => void;
  readonly onActivate: (paneId: string) => void;
  readonly onHorizontalScroll: (paneId: string, scrollLeft: number) => void;
}

export function LogPane({
  pane,
  lines,
  directoryLabel,
  onClose,
  onActivate,
  onHorizontalScroll,
}: LogPaneProps) {
  return (
    <article
      aria-label={`Log pane ${pane.title}`}
      data-testid="log-pane"
      data-active={pane.active}
      style={{
        flex: `0 0 ${pane.width}px`,
        minWidth: `${pane.width}px`,
        borderInlineEnd: "1px solid #c8ced8",
      }}
      onFocus={() => onActivate(pane.id)}
      onClick={() => onActivate(pane.id)}
    >
      <header>
        <h2>{pane.title}</h2>
        {directoryLabel ? <p>{directoryLabel}</p> : null}
        <ClosePaneButton title={pane.title} onClose={() => onClose(pane.id)} />
      </header>
      <div role="toolbar" aria-label={`Pane tools for ${pane.title}`}>
        <LogTextSelection title={pane.title} lines={lines} />
      </div>
      <HorizontalLogScroller
        title={pane.title}
        scrollLeft={pane.horizontalScroll}
        onScrollLeftChange={(scrollLeft) => onHorizontalScroll(pane.id, scrollLeft)}
      >
        <VirtualLogViewport title={pane.title} lines={lines} />
      </HorizontalLogScroller>
      <footer>{pane.status}</footer>
    </article>
  );
}
