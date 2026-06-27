import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { platform } from "node:process";

const repoRoot = process.cwd();

if (platform === "darwin") {
  runMacosXCTestHarness();
} else {
  runWdio();
}

function runMacosXCTestHarness() {
  const xctestrunPath = getOptionalPath("CROSSLOG_MACOS_UI_XCTESTRUN");
  const projectPath = getOptionalPath("CROSSLOG_MACOS_UI_XCODE_PROJECT");
  const workspacePath = getOptionalPath("CROSSLOG_MACOS_UI_XCODE_WORKSPACE");
  const scheme = process.env.CROSSLOG_MACOS_UI_SCHEME;
  const destination = process.env.CROSSLOG_MACOS_UI_DESTINATION ?? "platform=macOS";
  const derivedDataPath = process.env.CROSSLOG_MACOS_UI_DERIVED_DATA;

  if (xctestrunPath) {
    runCommand("xcodebuild", [
      "test-without-building",
      "-xctestrun",
      xctestrunPath,
      "-destination",
      destination,
      ...optionalDerivedDataArgs(derivedDataPath),
    ]);
    return;
  }

  if (projectPath && scheme) {
    runCommand("xcodebuild", [
      "test",
      "-project",
      projectPath,
      "-scheme",
      scheme,
      "-destination",
      destination,
      ...optionalDerivedDataArgs(derivedDataPath),
    ]);
    return;
  }

  if (workspacePath && scheme) {
    runCommand("xcodebuild", [
      "test",
      "-workspace",
      workspacePath,
      "-scheme",
      scheme,
      "-destination",
      destination,
      ...optionalDerivedDataArgs(derivedDataPath),
    ]);
    return;
  }

  console.error(
    [
      "macOS Desktop UI tests require a real XCTest/Accessibility harness.",
      "Set one of these configurations before running corepack pnpm test:ui:desktop:",
      "- CROSSLOG_MACOS_UI_XCTESTRUN=/path/to/harness.xctestrun",
      "- CROSSLOG_MACOS_UI_XCODE_PROJECT=/path/to/project.xcodeproj and CROSSLOG_MACOS_UI_SCHEME=<scheme>",
      "- CROSSLOG_MACOS_UI_XCODE_WORKSPACE=/path/to/workspace.xcworkspace and CROSSLOG_MACOS_UI_SCHEME=<scheme>",
      "Presence-only XCTest file validation is intentionally rejected.",
    ].join("\n"),
  );
  process.exit(1);
}

function runWdio() {
  runCommand("corepack", ["pnpm", "exec", "wdio", "run", "wdio.conf.ts"]);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}

function getOptionalPath(environmentKey) {
  const configuredPath = process.env[environmentKey];

  if (!configuredPath) {
    return null;
  }

  const absolutePath = resolvePath(configuredPath);

  if (!existsSync(absolutePath)) {
    console.error(`${environmentKey} does not exist: ${absolutePath}`);
    process.exit(1);
  }

  return absolutePath;
}

function resolvePath(pathValue) {
  return pathValue.startsWith("/") ? pathValue : join(repoRoot, pathValue);
}

function optionalDerivedDataArgs(derivedDataPath) {
  return derivedDataPath ? ["-derivedDataPath", resolvePath(derivedDataPath)] : [];
}
