import { readFile } from "node:fs/promises";

export async function assertFileBytesUnchanged(
  path: string,
  action: () => Promise<void>,
): Promise<void> {
  const before = await readFile(path);
  await action();
  const after = await readFile(path);

  if (!before.equals(after)) {
    throw new Error(`Expected ${path} to remain unchanged.`);
  }
}

