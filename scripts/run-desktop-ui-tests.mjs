import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { delimiter, join, resolve } from "node:path";
import { platform } from "node:process";
import { tmpdir } from "node:os";

const repoRoot = process.cwd();
const defaultMacosProjectPath = "apps/desktop/tests/ui/macos/CrosslogDesktopUITests.xcodeproj";
const defaultMacosScheme = "CrosslogDesktopUITests";
const defaultMacosAppBundlePath =
  "apps/desktop/src-tauri/target/debug/bundle/macos/Crosslog.app";
const defaultMacosAppBundleId = "dev.crosslog.desktop";

if (platform === "darwin") {
  timeSync("macOS desktop UI harness", runMacosXCTestHarness);
} else {
  timeAsync("WDIO desktop UI harness", () => runWdioHarness()).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

function logRunnerEvent(message) {
  console.log(`[crosslog-ui-runner] ${new Date().toISOString()} ${message}`);
}

function formatElapsed(milliseconds) {
  if (milliseconds < 1_000) {
    return `${milliseconds}ms`;
  }

  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

function timeSync(label, action) {
  const startedAt = Date.now();
  logRunnerEvent(`${label} started`);

  try {
    return action();
  } finally {
    logRunnerEvent(`${label} finished in ${formatElapsed(Date.now() - startedAt)}`);
  }
}

async function timeAsync(label, action) {
  const startedAt = Date.now();
  logRunnerEvent(`${label} started`);

  try {
    return await action();
  } finally {
    logRunnerEvent(`${label} finished in ${formatElapsed(Date.now() - startedAt)}`);
  }
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
    timeSync("macOS XCTest build product signing", () => sanitizeMacosBuildProducts(resolvePath(derivedDataPath)));
    timeSync("macOS XCTest execution", () => runCommand("xcodebuild", [
      "test-without-building",
      "-xctestrun",
      xctestrunPath,
      "-destination",
      destination,
      ...optionalDerivedDataArgs(derivedDataPath),
    ], macosTestEnvironment(appBundlePath, appBundleId)));
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

  timeSync("macOS XCTest build", () => runCommand("xcodebuild", [
    "build-for-testing",
    ...projectOrWorkspaceArgs,
    "-scheme",
    scheme,
    "-destination",
    destination,
    ...optionalDerivedDataArgs(derivedDataPath),
  ], testEnvironment));

  timeSync("macOS XCTest build product signing", () => sanitizeMacosBuildProducts(resolvedDerivedDataPath));

  timeSync("macOS XCTest execution", () => runCommand("xcodebuild", [
    "test-without-building",
    "-xctestrun",
    findMacosXCTestRunFile(resolvedDerivedDataPath),
    "-destination",
    destination,
    ...optionalDerivedDataArgs(derivedDataPath),
  ], testEnvironment));
}

async function runWdioHarness() {
  const driverPort = Number.parseInt(process.env.CROSSLOG_TAURI_DRIVER_PORT ?? "4444", 10);
  const baseEnvironment = { ...process.env, PATH: pathWithCargo() };

  if (!Number.isInteger(driverPort) || driverPort <= 0 || driverPort > 65_535) {
    console.error(`CROSSLOG_TAURI_DRIVER_PORT must be a valid TCP port: ${process.env.CROSSLOG_TAURI_DRIVER_PORT}`);
    process.exit(1);
  }

  timeSync("tauri-driver availability check", () => ensureTauriDriverAvailable(baseEnvironment));
  const appPath = prepareWdioApplication();
  const actionsPath = join(tmpdir(), `crosslog-ui-actions-${randomUUID()}.txt`);
  writeFileSync(actionsPath, "", "utf8");
  logRunnerEvent(`Desktop UI action queue created at ${actionsPath}`);

  const wdioEnvironment = {
    ...baseEnvironment,
    CROSSLOG_TAURI_APP_PATH: appPath,
    CROSSLOG_TAURI_DRIVER_PORT: String(driverPort),
    CROSSLOG_UI_TEST: "1",
    CROSSLOG_UI_TEST_ACTIONS_PATH: actionsPath,
  };
  logWdioSpecSelection(wdioEnvironment.CROSSLOG_WDIO_SPECS);
  const driver = timeSync(`tauri-driver start on port ${driverPort}`, () => startTauriDriver(driverPort, wdioEnvironment));

  try {
    await timeAsync(`tauri-driver TCP readiness on port ${driverPort}`, () => waitForTcpPort(driverPort));
    timeSync("WDIO desktop UI specs", () =>
      runCommand("corepack", ["pnpm", "exec", "wdio", "run", "wdio.conf.ts"], wdioEnvironment),
    );
  } finally {
    logRunnerEvent("tauri-driver stop started");
    driver.stop();
    rmSync(actionsPath, { force: true });
    logRunnerEvent("tauri-driver stop finished");
  }
}

function logWdioSpecSelection(specs) {
  const selectedSpecs = (specs ?? "")
    .split(/[\n,;]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (selectedSpecs.length === 0) {
    logRunnerEvent("WDIO desktop UI specs selected: all");
    return;
  }

  logRunnerEvent(`WDIO desktop UI specs selected: ${selectedSpecs.join(", ")}`);
}

function prepareWdioApplication() {
  const configuredApplicationPath = getOptionalPath("CROSSLOG_TAURI_APP_PATH");

  if (configuredApplicationPath) {
    logRunnerEvent(`Using configured Desktop application: ${configuredApplicationPath}`);
    return configuredApplicationPath;
  }

  if (process.env.CROSSLOG_DESKTOP_UI_SKIP_APP_BUILD !== "true") {
    timeSync("Tauri debug application build", () => runCommand(
      "corepack",
      ["pnpm", "--filter", "@crosslog/desktop", "tauri", "build", "--debug", "--no-bundle", "--", "--locked"],
      { ...process.env, PATH: pathWithCargo(), CROSSLOG_UI_TEST: "1" },
    ));
  } else {
    logRunnerEvent("Tauri debug application build skipped by CROSSLOG_DESKTOP_UI_SKIP_APP_BUILD=true");
  }

  const applicationPath = resolvePath(
    join(
      "apps",
      "desktop",
      "src-tauri",
      "target",
      "debug",
      platform === "win32" ? "crosslog-desktop.exe" : "crosslog-desktop",
    ),
  );

  if (!existsSync(applicationPath)) {
    console.error(`Crosslog Desktop application does not exist: ${applicationPath}`);
    process.exit(1);
  }

  return applicationPath;
}

function ensureTauriDriverAvailable(env) {
  const result = spawnSync(process.env.CROSSLOG_TAURI_DRIVER_PATH ?? "tauri-driver", ["--help"], {
    cwd: repoRoot,
    env,
    encoding: "utf8",
  });

  if ((result.status ?? 1) === 0) {
    return;
  }

  console.error(
    [
      "tauri-driver is required for Windows/Linux Desktop UI tests.",
      "Install it before running corepack pnpm test:ui:desktop:",
      "  cargo install tauri-driver --locked",
    ].join("\n"),
  );
  process.exit(1);
}

function startTauriDriver(port, env) {
  let stopping = false;
  const driverProcess = spawn(process.env.CROSSLOG_TAURI_DRIVER_PATH ?? "tauri-driver", ["--port", String(port)], {
    cwd: repoRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  driverProcess.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  driverProcess.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  driverProcess.on("error", (error) => {
    if (!stopping) {
      console.error(`Failed to run tauri-driver: ${error.message}`);
    }
  });
  driverProcess.on("exit", (code, signal) => {
    if (stopping) {
      return;
    }

    if (code !== null && code !== 0) {
      console.error(`tauri-driver exited with code ${code}`);
    } else if (signal) {
      console.error(`tauri-driver exited after signal ${signal}`);
    }
  });

  return {
    stop() {
      if (driverProcess.exitCode !== null || driverProcess.killed) {
        return;
      }

      stopping = true;
      driverProcess.kill();
    },
  };
}

async function waitForTcpPort(port) {
  const deadline = Date.now() + 10_000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      await probeTcpPort(port);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }

  console.error(`Timed out waiting for tauri-driver on 127.0.0.1:${port}: ${lastError?.message ?? "unknown error"}`);
  process.exit(1);
}

function probeTcpPort(port) {
  return new Promise((resolvePromise, rejectPromise) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.end();
      resolvePromise();
    });
    socket.once("error", rejectPromise);
    socket.setTimeout(1_000, () => {
      socket.destroy();
      rejectPromise(new Error("connection timed out"));
    });
  });
}

function prepareMacosAppBundle() {
  const configuredBundlePath = getOptionalPath("CROSSLOG_DESKTOP_APP_BUNDLE_PATH");

  if (configuredBundlePath) {
    return configuredBundlePath;
  }

  if (process.env.CROSSLOG_MACOS_UI_SKIP_APP_BUILD !== "true") {
    timeSync("Tauri macOS app bundle build", () => runCommand(
      "corepack",
      [
        "pnpm",
        "--filter",
        "@crosslog/desktop",
        "tauri",
        "build",
        "--debug",
        "--bundles",
        "app",
        "--no-sign",
        "--",
        "--locked",
      ],
      { ...process.env, PATH: pathWithCargo() },
    ));
  } else {
    logRunnerEvent("Tauri macOS app bundle build skipped by CROSSLOG_MACOS_UI_SKIP_APP_BUILD=true");
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
    shell: platform === "win32" && command === "corepack",
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Failed to run ${command}: ${result.error.message}`);
    process.exit(1);
  }

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
    CROSSLOG_UI_TEST_PERSIST_SESSION: "1",
  };
}

function pathWithCargo() {
  const existingPath = process.env.PATH ?? "";
  const cargoBin = join(process.env.HOME ?? "", ".cargo", "bin");

  return cargoBin && !existingPath.split(delimiter).includes(cargoBin)
    ? `${cargoBin}${delimiter}${existingPath}`
    : existingPath;
}
