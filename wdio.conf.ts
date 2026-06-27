const tauriApplicationPath = process.env.CROSSLOG_TAURI_APP_PATH;
const tauriDriverPort = Number.parseInt(process.env.CROSSLOG_TAURI_DRIVER_PORT ?? "4444", 10);

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
  specs: ["apps/desktop/tests/ui/**/*.spec.ts"],
  maxInstances: 1,
  framework: "mocha",
  reporters: ["spec"],
  capabilities: [
    {
      browserName: "wry",
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
