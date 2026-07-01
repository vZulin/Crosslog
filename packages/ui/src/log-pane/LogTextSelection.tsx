import React, { useState } from "react";

export interface ClipboardWriter {
  readonly writeText: (text: string) => Promise<void>;
}

export interface LogTextSelectionProps {
  readonly title: string;
  readonly lines: readonly string[];
  readonly selectedLineIndexes?: readonly number[];
  readonly clipboard?: ClipboardWriter;
  readonly onCopied?: (title: string) => void;
  readonly children?: React.ReactNode;
}

export function formatSelectedLogText(lines: readonly string[], selectedLineIndexes?: readonly number[]): string {
  const selectedLines =
    selectedLineIndexes && selectedLineIndexes.length > 0
      ? selectedLineIndexes.map((index) => lines[index]).filter((line): line is string => line !== undefined)
      : lines.slice(0, 2);

  return selectedLines.join("\n");
}

export async function copySelectedLogText(
  lines: readonly string[],
  selectedLineIndexes?: readonly number[],
  clipboard: ClipboardWriter | undefined = globalThis.navigator?.clipboard,
): Promise<string> {
  const text = formatSelectedLogText(lines, selectedLineIndexes);

  try {
    await clipboard?.writeText(text);
  } catch {
    // Clipboard permission can be unavailable in WebView and test environments.
  }

  return text;
}

export function LogTextSelection({
  children,
  title,
  lines,
  selectedLineIndexes,
  clipboard,
  onCopied,
}: LogTextSelectionProps) {
  const [menuState, setMenuState] = useState<CopyMenuState | null>(null);
  const menuRef = React.useRef<HTMLButtonElement | null>(null);

  const copy = () => {
    void copySelectedLogText(lines, selectedLineIndexes, clipboard).then(() => {
      setMenuState(null);
      onCopied?.(title);
    });
  };

  return (
    <div
      aria-label={`Log text actions for ${title}`}
      className="crosslog-log-text-selection"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
          copy();
        }
      }}
      onPointerDownCapture={(event) => {
        if (!menuState) {
          return;
        }

        if (menuRef.current?.contains(event.target as Node)) {
          return;
        }

        setMenuState(null);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuState(positionCopyAction(event.currentTarget, event.clientX, event.clientY));
      }}
      role="group"
      tabIndex={0}
    >
      {children}
      {menuState ? (
        <button
          className="crosslog-log-text-selection__menuitem"
          data-pointer-anchored={menuState.pointerAnchored ? "true" : "false"}
          data-viewport-bounded={menuState.viewportBounded ? "true" : "false"}
          ref={menuRef}
          style={{
            left: `${menuState.left}px`,
            top: `${menuState.top}px`,
          }}
          type="button"
          role="menuitem"
          onClick={copy}
        >
          Copy selected text
        </button>
      ) : null}
    </div>
  );
}

interface CopyMenuState {
  readonly left: number;
  readonly top: number;
  readonly pointerAnchored: boolean;
  readonly viewportBounded: boolean;
}

const copyActionEstimatedWidthPx = 156;
const copyActionEstimatedHeightPx = 33;
const copyActionViewportPaddingPx = 8;

function positionCopyAction(container: HTMLElement, clientX: number, clientY: number): CopyMenuState {
  const rect = container.getBoundingClientRect();
  const pointerLeft = clientX - rect.left;
  const pointerTop = clientY - rect.top;
  const maxLeft = Math.max(
    copyActionViewportPaddingPx,
    rect.width - copyActionEstimatedWidthPx - copyActionViewportPaddingPx,
  );
  const maxTop = Math.max(
    copyActionViewportPaddingPx,
    rect.height - copyActionEstimatedHeightPx - copyActionViewportPaddingPx,
  );
  const left = clamp(pointerLeft, copyActionViewportPaddingPx, maxLeft);
  const top = clamp(pointerTop, copyActionViewportPaddingPx, maxTop);

  return {
    left,
    top,
    pointerAnchored: Math.abs(left - pointerLeft) <= 1 && Math.abs(top - pointerTop) <= 1,
    viewportBounded:
      left >= copyActionViewportPaddingPx &&
      top >= copyActionViewportPaddingPx &&
      left + copyActionEstimatedWidthPx <= rect.width - copyActionViewportPaddingPx + 1 &&
      top + copyActionEstimatedHeightPx <= rect.height - copyActionViewportPaddingPx + 1,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
