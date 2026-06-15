export function assertRenderedAsInertText(container: HTMLElement, rawText: string): void {
  if (!container.textContent?.includes(rawText)) {
    throw new Error("Expected raw log text to be present as text content.");
  }

  if (container.querySelector("script,a")) {
    throw new Error("Expected log content to remain inert, without active elements.");
  }
}

