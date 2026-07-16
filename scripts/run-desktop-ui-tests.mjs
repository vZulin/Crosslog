import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
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
const defaultLargeLogFixturePath = "tests/fixtures/logs/idea.3.log";

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
  const nativeDriverPort = Number.parseInt(process.env.CROSSLOG_TAURI_DRIVER_NATIVE_PORT ?? "4445", 10);
  const nativeDriverPath = getOptionalPath("CROSSLOG_TAURI_NATIVE_DRIVER_PATH");
  const driverStartupRetries = parseDriverStartupRetries();
  const baseEnvironment = { ...process.env, PATH: pathWithCargo() };

  if (!Number.isInteger(driverPort) || driverPort <= 0 || driverPort > 65_535) {
    console.error(`CROSSLOG_TAURI_DRIVER_PORT must be a valid TCP port: ${process.env.CROSSLOG_TAURI_DRIVER_PORT}`);
    process.exit(1);
  }

  if (!Number.isInteger(nativeDriverPort) || nativeDriverPort <= 0 || nativeDriverPort > 65_535) {
    console.error(
      `CROSSLOG_TAURI_DRIVER_NATIVE_PORT must be a valid TCP port: ${process.env.CROSSLOG_TAURI_DRIVER_NATIVE_PORT}`,
    );
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
    CROSSLOG_UI_TEST_LARGE_LOG_PATH: resolvePath(defaultLargeLogFixturePath),
  };
  logWdioSpecSelection(wdioEnvironment.CROSSLOG_WDIO_SPECS);
  logRunnerEvent(`WDIO max instances configured: ${wdioEnvironment.CROSSLOG_WDIO_MAX_INSTANCES ?? "1"}`);
  logRunnerEvent(
    nativeDriverPath
      ? `Using configured native WebDriver: ${nativeDriverPath}`
      : "Using native WebDriver discovered from PATH",
  );
  let driver = null;

  try {
    for (let attempt = 1; attempt <= driverStartupRetries + 1; attempt += 1) {
      driver = timeSync(
        `tauri-driver start on port ${driverPort} (attempt ${attempt})`,
        () => startTauriDriver(driverPort, nativeDriverPort, nativeDriverPath, wdioEnvironment),
      );

      try {
        await timeAsync(
          `tauri-driver and native WebDriver readiness on port ${driverPort}`,
          () => waitForWebDriverStatus(driverPort),
        );
      } catch (error) {
        if (attempt > driverStartupRetries) {
          throw error;
        }

        logRunnerEvent(
          `Retrying Desktop UI specs after native WebDriver readiness failure (${attempt}/${driverStartupRetries})`,
        );
        await stopTauriDriver(driver, driverPort, nativeDriverPort);
        driver = null;
        await delay(1_000);
        continue;
      }

      const result = timeSync("WDIO desktop UI specs", () => runWdioSpecs(wdioEnvironment));

      if (result.status === 0) {
        return;
      }

      if (!isRetryableDriverStartupFailure(result.output) || attempt > driverStartupRetries) {
        process.exitCode = result.status;
        return;
      }

      logRunnerEvent(
        `Retrying Desktop UI specs after tauri-driver startup failure (${attempt}/${driverStartupRetries})`,
      );
      await stopTauriDriver(driver, driverPort, nativeDriverPort);
      driver = null;
      await delay(1_000);
    }
  } finally {
    logRunnerEvent("tauri-driver stop started");
    await stopTauriDriver(driver, driverPort, nativeDriverPort);
    rmSync(actionsPath, { force: true });
    logRunnerEvent("tauri-driver stop finished");
  }
}

function parseDriverStartupRetries() {
  const defaultRetries = platform === "win32" ? 2 : 0;
  const configuredRetries = Number.parseInt(
    process.env.CROSSLOG_TAURI_DRIVER_STARTUP_RETRIES ?? String(defaultRetries),
    10,
  );

  if (!Number.isInteger(configuredRetries) || configuredRetries < 0) {
    console.error(
      `CROSSLOG_TAURI_DRIVER_STARTUP_RETRIES must be a non-negative integer: ${process.env.CROSSLOG_TAURI_DRIVER_STARTUP_RETRIES}`,
    );
    process.exit(1);
  }

  return configuredRetries;
}

function runWdioSpecs(environment) {
  const result = spawnSync(
    "corepack",
    ["pnpm", "exec", "wdio", "run", "wdio.conf.ts"],
    {
      cwd: repoRoot,
      env: environment,
      shell: platform === "win32",
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    console.error(`Failed to run Desktop UI specs: ${result.error.message}`);
  }

  return {
    output,
    status: result.status ?? 1,
  };
}

function isRetryableDriverStartupFailure(output) {
  return /UND_ERR_SOCKET|DevToolsActivePort file doesn't exist|operation was aborted due to timeout when running .*\/session/i.test(
    output,
  );
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
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

function startTauriDriver(port, nativePort, nativeDriverPath, env) {
  let stopping = false;
  const driverArgs = ["--port", String(port), "--native-port", String(nativePort)];

  if (nativeDriverPath) {
    driverArgs.push("--native-driver", nativeDriverPath);
  }

  const driverProcess = spawn(
    process.env.CROSSLOG_TAURI_DRIVER_PATH ?? "tauri-driver",
    driverArgs,
    {
      cwd: repoRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

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
      if (driverProcess.exitCode !== null) {
        return Promise.resolve();
      }

      stopping = true;
      return new Promise((resolvePromise) => {
        const resolveOnce = () => {
          clearTimeout(timeoutId);
          resolvePromise();
        };
        const timeoutId = setTimeout(resolveOnce, 10_000);

        driverProcess.once("exit", resolveOnce);

        if (platform === "win32" && driverProcess.pid) {
          const result = spawnSync("taskkill", ["/pid", String(driverProcess.pid), "/t", "/f"], {
            cwd: repoRoot,
            windowsHide: true,
          });

          if (result.error) {
            console.warn(`Warning: failed to terminate the tauri-driver process tree: ${result.error.message}`);
          }

          if (driverProcess.exitCode !== null) {
            resolveOnce();
          }
          return;
        }

        driverProcess.kill();
      });
    },
  };
}

async function stopTauriDriver(driver, port, nativePort) {
  if (!driver) {
    return;
  }

  await driver.stop();
  await waitForTcpPortToClose(port);
  await waitForTcpPortToClose(nativePort);
}

async function waitForWebDriverStatus(port) {
  const deadline = Date.now() + 30_000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      await probeWebDriverStatus(port);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }

  throw new Error(
    `Timed out waiting for WebDriver readiness on 127.0.0.1:${port}: ${lastError?.message ?? "unknown error"}`,
  );
}

function probeWebDriverStatus(port) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = httpRequest({ host: "127.0.0.1", method: "GET", path: "/status", port }, (response) => {
      response.resume();

      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`unexpected HTTP status ${response.statusCode ?? "unknown"}`));
    });

    request.once("error", rejectPromise);
    request.setTimeout(1_000, () => {
      request.destroy(new Error("request timed out"));
    });
    request.end();
  });
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

async function waitForTcpPortToClose(port) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      await probeTcpPort(port);
      await delay(100);
    } catch {
      return;
    }
  }

  throw new Error(`Timed out waiting for tauri-driver to release 127.0.0.1:${port}`);
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
    CROSSLOG_UI_TEST_LARGE_LOG_PATH: resolvePath(defaultLargeLogFixturePath),
  };
}

function pathWithCargo() {
  const existingPath = process.env.PATH ?? "";
  const cargoBin = join(process.env.HOME ?? "", ".cargo", "bin");

  return cargoBin && !existingPath.split(delimiter).includes(cargoBin)
    ? `${cargoBin}${delimiter}${existingPath}`
    : existingPath;
}
