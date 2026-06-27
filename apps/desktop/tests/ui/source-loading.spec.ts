import { waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop source loading", () => {
  it("keeps the shell available for picker and drag/drop bindings", async () => {
    await waitForDesktopShell();
  });
});
