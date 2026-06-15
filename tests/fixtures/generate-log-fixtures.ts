import { writeFile } from "node:fs/promises";

export async function generateLogFixture(path: string, lineCount: number): Promise<void> {
  const lines = Array.from({ length: lineCount }, (_, index) => {
    const lineNumber = index + 1;
    return `2026-06-15T12:00:${String(index % 60).padStart(2, "0")}.000Z line ${lineNumber}`;
  });

  await writeFile(path, `${lines.join("\n")}\n`, "utf8");
}

