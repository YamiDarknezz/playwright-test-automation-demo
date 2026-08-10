import { defineConfig, devices } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

// The Inventory API jar lives in the sibling repo. Override with
// INVENTORY_JAR when running in CI (where it is checked out inside the workspace).
const API_JAR = process.env.INVENTORY_JAR ?? "../inventory-api/target/inventory-api-0.1.0.jar";

// When targeting a remote API (e.g. production https://api-inventory.darknezz.dev)
// there is no local jar to boot — skip the webServer entirely.
const isRemote = API_URL.startsWith("http://localhost") === false;

export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/pages/**", // page objects are imported by specs, not run directly
  // Platform-independent snapshot paths: baselines are generated on Linux (CI)
  // so every OS compares against the same images.
  snapshotPathTemplate: "{testDir}/ui/visual.spec.ts-snapshots/{arg}{ext}",
  timeout: 30_000,
  // The API is also exercised in CI from a cold JVM start, so retries
  // protect against slow first boots (flaky-test thinking).
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],
  use: {
    baseURL: API_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "api", testMatch: /tests\/api\// },
    { name: "ui-chromium", use: { ...devices["Desktop Chrome"] }, testMatch: /tests\/ui\/(?!mobile)/ },
    {
      name: "ui-mobile",
      use: { ...devices["iPhone 13"] },
      testMatch: /tests\/ui\/mobile\.spec\.ts/,
    },
  ],
  ...(isRemote
    ? {}
    : {
        webServer: {
          command: `java -jar ${API_JAR}`,
          url: `${API_URL}/actuator/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
