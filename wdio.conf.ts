export const config = {
  runner: "local",
  specs: ["apps/desktop/tests/ui/**/*.spec.ts"],
  maxInstances: 1,
  framework: "mocha",
  reporters: ["spec"],
  capabilities: [
    {
      browserName: "wry"
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

