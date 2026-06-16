import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { platform } from "node:process";

const repoRoot = process.cwd();
const macosHarnessFiles = [
  "apps/desktop/tests/ui/macos/CrosslogUITests.swift",
  "apps/desktop/tests/ui/macos/EmptyStateUITests.swift",
  "apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift",
  "apps/desktop/tests/ui/macos/LogTextCopyUITests.swift",
];

if (platform === "darwin") {
  validateMacosHarness();
} else {
  runWdio();
}

function validateMacosHarness() {
  for (const file of macosHarnessFiles) {
    const absolutePath = join(repoRoot, file);

    if (!existsSync(absolutePath)) {
      console.error(`Missing macOS Desktop UI harness file: ${file}`);
      process.exit(1);
    }

    const source = readFileSync(absolutePath, "utf8");

    if (!source.includes("XCTest")) {
      console.error(`macOS Desktop UI harness file does not import XCTest: ${file}`);
      process.exit(1);
    }
  }

  console.log("macOS Desktop UI harness files are present and XCTest-based.");
}

function runWdio() {
  const result = spawnSync("corepack", ["pnpm", "exec", "wdio", "run", "wdio.conf.ts"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}
