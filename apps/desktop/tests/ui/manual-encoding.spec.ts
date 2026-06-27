import { waitForDesktopShell } from "./helpers/redesigned-shell";

describe("Desktop manual encoding", () => {
  it("keeps the shell available for encoding workflows", async () => {
    await waitForDesktopShell();
  });
});
