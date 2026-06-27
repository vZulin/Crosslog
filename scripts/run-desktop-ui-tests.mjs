import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { platform } from "node:process";

const repoRoot = process.cwd();
const defaultMacosProjectPath = "apps/desktop/tests/ui/macos/CrosslogDesktopUITests.xcodeproj";
const defaultMacosScheme = "CrosslogDesktopUITests";
const defaultMacosAppBundlePath =
  "apps/desktop/src-tauri/target/debug/bundle/macos/Crosslog.app";
const defaultMacosAppBundleId = "dev.crosslog.desktop";

if (platform === "darwin") {
  runMacosXCTestHarness();
} else {
  runWdio();
}

function runMacosXCTestHarness() {
  ensureMacosDeveloperModeEnabled();

  const xctestrunPath = getOptionalPath("CROSSLOG_MACOS_UI_XCTESTRUN");
  const projectPath =
    getOptionalPath("CROSSLOG_MACOS_UI_XCODE_PROJECT") ?? resolvePath(defaultMacosProjectPath);
  const workspacePath = getOptionalPath("CROSSLOG_MACOS_UI_XCODE_WORKSPACE");
  const scheme = process.env.CROSSLOG_MACOS_UI_SCHEME ?? defaultMacosScheme;
  const destination = process.env.CROSSLOG_MACOS_UI_DESTINATION ?? "platform=macOS";
  const derivedDataPath =
    process.env.CROSSLOG_MACOS_UI_DERIVED_DATA ?? ".build/crosslog-macos-ui-derived-data";
  const appBundlePath = prepareMacosAppBundle();
  const appBundleId = process.env.CROSSLOG_DESKTOP_APP_BUNDLE_ID ?? defaultMacosAppBundleId;

  prepareMacosBundleForAutomation(appBundlePath, { sign: true });
  registerMacosAppBundle(appBundlePath);

  if (xctestrunPath) {
    sanitizeMacosBuildProducts(resolvePath(derivedDataPath));
    runCommand("xcodebuild", [
      "test-without-building",
      "-xctestrun",
      xctestrunPath,
      "-destination",
      destination,
      ...optionalDerivedDataArgs(derivedDataPath),
    ], macosTestEnvironment(appBundlePath, appBundleId));
    return;
  }

  const projectOrWorkspaceArgs = workspacePath
    ? ["-workspace", workspacePath]
    : ["-project", projectPath];

  if (workspacePath && scheme) {
    runBuiltMacosXCTestHarness(
      projectOrWorkspaceArgs,
      scheme,
      destination,
      derivedDataPath,
      appBundlePath,
      appBundleId,
    );
    return;
  }

  if (projectPath && scheme) {
    runBuiltMacosXCTestHarness(
      projectOrWorkspaceArgs,
      scheme,
      destination,
      derivedDataPath,
      appBundlePath,
      appBundleId,
    );
    return;
  }

  console.error(
    [
      "macOS Desktop UI tests require a real XCTest/Accessibility harness.",
      "The built-in harness was not found. Set one of these configurations before running corepack pnpm test:ui:desktop:",
      "- CROSSLOG_MACOS_UI_XCTESTRUN=/path/to/harness.xctestrun",
      "- CROSSLOG_MACOS_UI_XCODE_PROJECT=/path/to/project.xcodeproj and CROSSLOG_MACOS_UI_SCHEME=<scheme>",
      "- CROSSLOG_MACOS_UI_XCODE_WORKSPACE=/path/to/workspace.xcworkspace and CROSSLOG_MACOS_UI_SCHEME=<scheme>",
      "Presence-only XCTest file validation is intentionally rejected.",
    ].join("\n"),
  );
  process.exit(1);
}

function ensureMacosDeveloperModeEnabled() {
  const devToolsSecurityPath = "/usr/sbin/DevToolsSecurity";

  if (!existsSync(devToolsSecurityPath)) {
    return;
  }

  if (macosDeveloperModeEnabled(devToolsSecurityPath)) {
    return;
  }

  runOptionalCommand(devToolsSecurityPath, ["-enable"]);

  if (!macosDeveloperModeEnabled(devToolsSecurityPath)) {
    console.error(
      [
        "macOS Developer mode is disabled, so XCTest UI automation cannot enable automation mode.",
        "Run this once before the Desktop UI gate:",
        "  /usr/sbin/DevToolsSecurity -enable",
      ].join("\n"),
    );
    process.exit(1);
  }
}

function macosDeveloperModeEnabled(devToolsSecurityPath) {
  const result = spawnSync(devToolsSecurityPath, ["-status"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });

  return `${result.stdout}\n${result.stderr}`.includes("currently enabled");
}

function runBuiltMacosXCTestHarness(
  projectOrWorkspaceArgs,
  scheme,
  destination,
  derivedDataPath,
  appBundlePath,
  appBundleId,
) {
  const resolvedDerivedDataPath = resolvePath(derivedDataPath);
  const testEnvironment = macosTestEnvironment(appBundlePath, appBundleId);

  runCommand("xcodebuild", [
    "build-for-testing",
    ...projectOrWorkspaceArgs,
    "-scheme",
    scheme,
    "-destination",
    destination,
    ...optionalDerivedDataArgs(derivedDataPath),
  ], testEnvironment);

  sanitizeMacosBuildProducts(resolvedDerivedDataPath);

  runCommand("xcodebuild", [
    "test-without-building",
    "-xctestrun",
    findMacosXCTestRunFile(resolvedDerivedDataPath),
    "-destination",
    destination,
    ...optionalDerivedDataArgs(derivedDataPath),
  ], testEnvironment);
}

function runWdio() {
  runCommand("corepack", ["pnpm", "exec", "wdio", "run", "wdio.conf.ts"]);
}

function prepareMacosAppBundle() {
  const configuredBundlePath = getOptionalPath("CROSSLOG_DESKTOP_APP_BUNDLE_PATH");

  if (configuredBundlePath) {
    return configuredBundlePath;
  }

  if (process.env.CROSSLOG_MACOS_UI_SKIP_APP_BUILD !== "true") {
    runCommand(
      "corepack",
      ["pnpm", "--filter", "@crosslog/desktop", "tauri", "build", "--debug", "--bundles", "app", "--no-sign"],
      { ...process.env, PATH: pathWithCargo() },
    );
  }

  const appBundlePath = resolvePath(defaultMacosAppBundlePath);

  if (!existsSync(appBundlePath)) {
    console.error(`Crosslog Desktop app bundle does not exist: ${appBundlePath}`);
    process.exit(1);
  }

  return appBundlePath;
}

function prepareMacosBundleForAutomation(bundlePath, { sign }) {
  runOptionalCommand("xattr", ["-rc", bundlePath]);
  runOptionalCommand("xattr", ["-rd", "com.apple.quarantine", bundlePath]);
  runOptionalCommand("xattr", ["-rd", "com.apple.provenance", bundlePath]);

  if (sign) {
    runCommand("codesign", ["--force", "--deep", "--sign", "-", bundlePath]);
    verifyMacosBundleSignature(bundlePath);
  }
}

function sanitizeMacosBuildProducts(derivedDataPath) {
  const productsPath = join(derivedDataPath, "Build", "Products");

  if (!existsSync(productsPath)) {
    return;
  }

  findDirectories(productsPath, (pathValue) => pathValue.endsWith(".app") || pathValue.endsWith(".xctest"))
    .sort((left, right) => right.length - left.length)
    .forEach((bundlePath) => prepareMacosBundleForAutomation(bundlePath, { sign: true }));
}

function verifyMacosBundleSignature(bundlePath) {
  runCommand("codesign", ["--verify", "--deep", "--strict", "--verbose=2", bundlePath]);
}

function findMacosXCTestRunFile(derivedDataPath) {
  const productsPath = join(derivedDataPath, "Build", "Products");
  const xctestrunFiles = findFiles(productsPath, (pathValue) => pathValue.endsWith(".xctestrun"));

  if (xctestrunFiles.length === 0) {
    console.error(`No .xctestrun file was produced under ${productsPath}`);
    process.exit(1);
  }

  xctestrunFiles.sort();
  return xctestrunFiles[xctestrunFiles.length - 1];
}

function findDirectories(rootPath, predicate) {
  return findPaths(rootPath, predicate, (stats) => stats.isDirectory());
}

function findFiles(rootPath, predicate) {
  return findPaths(rootPath, predicate, (stats) => stats.isFile());
}

function findPaths(rootPath, predicate, typePredicate) {
  if (!existsSync(rootPath)) {
    return [];
  }

  const results = [];
  const entries = readdirSync(rootPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const pathValue = join(rootPath, entry.name);
    const stats = lstatSync(pathValue);

    if (typePredicate(stats) && predicate(pathValue)) {
      results.push(pathValue);
    }

    if (stats.isDirectory() && !entry.isSymbolicLink()) {
      results.push(...findPaths(pathValue, predicate, typePredicate));
    }
  });

  return results;
}

function registerMacosAppBundle(appBundlePath) {
  const lsregisterPath =
    "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister";

  if (!existsSync(lsregisterPath)) {
    return;
  }

  const result = spawnSync(lsregisterPath, ["-f", appBundlePath], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });

  if ((result.status ?? 1) !== 0) {
    console.warn(`Warning: failed to register macOS app bundle for UI tests: ${appBundlePath}`);
  }
}

function runOptionalCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.warn(`Warning: failed to run optional command ${command}: ${result.error.message}`);
  }
}

function runCommand(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });

  const status = result.status ?? 1;

  if (status !== 0) {
    process.exit(status);
  }
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

function macosTestEnvironment(appBundlePath, appBundleId) {
  return {
    ...process.env,
    CROSSLOG_DESKTOP_APP_BUNDLE_ID: appBundleId,
    CROSSLOG_DESKTOP_APP_BUNDLE_PATH: appBundlePath,
  };
}

function pathWithCargo() {
  const existingPath = process.env.PATH ?? "";
  const cargoBin = join(process.env.HOME ?? "", ".cargo", "bin");

  return cargoBin && !existingPath.split(delimiter).includes(cargoBin)
    ? `${cargoBin}${delimiter}${existingPath}`
    : existingPath;
}
