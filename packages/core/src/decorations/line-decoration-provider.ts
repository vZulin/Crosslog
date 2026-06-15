import type { LogLine } from "../log-line/log-line";

export interface LineDecoration {
  readonly className: string;
  readonly label: string;
}

export interface LineDecorationProvider {
  getDecorations(line: LogLine): readonly LineDecoration[];
}

export const noOpLineDecorationProvider: LineDecorationProvider = {
  getDecorations: () => [],
};

