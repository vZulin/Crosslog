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
  title,
  lines,
  selectedLineIndexes,
  clipboard,
  onCopied,
}: LogTextSelectionProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void copySelectedLogText(lines, selectedLineIndexes, clipboard).then(() => {
      setCopied(true);
      setMenuOpen(false);
      onCopied?.(title);
    });
  };

  return (
    <div
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen(true);
      }}
    >
      <button type="button" aria-label={`Copy selected text from ${title}`} onClick={copy}>
        Copy
      </button>
      {menuOpen ? (
        <button type="button" role="menuitem" onClick={copy}>
          Copy selected text
        </button>
      ) : null}
      {copied ? (
        <span role="status" aria-label={`Copied ${title}`}>
          Copied
        </span>
      ) : null}
    </div>
  );
}
