import { appendFileSync } from "node:fs";
import { browser } from "@wdio/globals";

const tauriApplicationPath = process.env.CROSSLOG_TAURI_APP_PATH;
const tauriDriverPort = Number.parseInt(process.env.CROSSLOG_TAURI_DRIVER_PORT ?? "4444", 10);
const configuredSpecs = parseConfiguredSpecs(process.env.CROSSLOG_WDIO_SPECS);
const maxInstances = parseConfiguredMaxInstances(process.env.CROSSLOG_WDIO_MAX_INSTANCES);

if (!tauriApplicationPath) {
  throw new Error("CROSSLOG_TAURI_APP_PATH must point to the built Crosslog Desktop application.");
}

if (!Number.isInteger(tauriDriverPort) || tauriDriverPort <= 0 || tauriDriverPort > 65_535) {
  throw new Error(`CROSSLOG_TAURI_DRIVER_PORT must be a valid TCP port: ${process.env.CROSSLOG_TAURI_DRIVER_PORT}`);
}

export const config = {
  runner: "local",
  hostname: process.env.CROSSLOG_TAURI_DRIVER_HOST ?? "127.0.0.1",
  port: tauriDriverPort,
  path: "/",
  // Keep the selected files in one spec group. A single tauri-driver instance
  // cannot serve concurrent WebDriver sessions reliably on Windows runners.
  specs:
    configuredSpecs.length > 0
      ? [configuredSpecs]
      : [["apps/desktop/tests/ui/**/*.spec.ts"]],
  maxInstances,
  maxInstancesPerCapability: maxInstances,
  beforeTest: async () => {
    const actionsPath = process.env.CROSSLOG_UI_TEST_ACTIONS_PATH;

    if (!actionsPath) {
      return;
    }

    appendFileSync(actionsPath, "resetWorkspace\n", "utf8");
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();

      return title.includes("state=empty") && title.includes("panes=0") && title.includes("settingsSurface=closed");
    }, {
      interval: 100,
      timeout: 15_000,
      timeoutMsg: "Desktop UI test workspace did not reset before the test.",
    });
  },
  framework: "mocha",
  reporters: ["spec"],
  capabilities: [
    {
      "wdio:maxInstances": maxInstances,
      "tauri:options": {
        application: tauriApplicationPath
      }
    }
  ],
  logLevel: "info",
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  mochaOpts: {
    ui: "bdd",
    timeout: 60_000
  }
};

function parseConfiguredSpecs(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[\n,;]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseConfiguredMaxInstances(value: string | undefined): number {
  const resolved = Number.parseInt(value ?? "1", 10);

  if (!Number.isInteger(resolved) || resolved <= 0) {
    throw new Error(`CROSSLOG_WDIO_MAX_INSTANCES must be a positive integer: ${value}`);
  }

  return resolved;
}
