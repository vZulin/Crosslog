import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("restores panes from last valid browser session after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open logs" }).click();
  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await waitForLastValidSession(page);

  await writeCorruptPendingSession(page);
  await page.reload();

  await expect(page.getByRole("heading", { name: "app.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "service.log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "app-2026-06-16.log" })).toBeVisible();
});

async function waitForLastValidSession(page: Page) {
  await page.waitForFunction(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("crosslog-session", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return new Promise<boolean>((resolve, reject) => {
      const request = database.transaction("snapshots", "readonly").objectStore("snapshots").get("last-valid");
      request.onsuccess = () => resolve(Boolean(request.result));
      request.onerror = () => reject(request.error);
    });
  });
}

async function writeCorruptPendingSession(page: Page) {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("crosslog-session", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const request = database.transaction("snapshots", "readwrite").objectStore("snapshots").put(
        { schemaVersion: 1, panes: [{ horizontalScroll: 900 }] },
        "pending",
      );
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}
