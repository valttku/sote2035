import { test, expect } from "@playwright/test";

const MOCK_SETTINGS = {
  id: 1,
  email: "test@example.com",
  display_name: "Test User",
  gender: "male",
  height: 180,
  weight: 75,
  birthday: "1990-06-15T00:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  last_login: "2025-01-15T10:00:00.000Z",
  polarLinked: false,
  garminLinked: true,
};

async function mockSettingsApis(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/settings", (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({ status: 200, body: JSON.stringify(MOCK_SETTINGS) });
    } else {
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    }
  });
  await page.route("**/api/v1/settings/**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
  );
  await page.route("**/api/v1/home**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ alerts: {}, aiMessage: "", user: {} }),
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// Settings Page
// ─────────────────────────────────────────────────────────────
test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSettingsApis(page);
    await page.goto("/settings");
    await page.waitForTimeout(500);
  });

  test("renders the settings page", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("shows Garmin integration status", async ({ page }) => {
    await expect(page.getByText(/garmin/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("shows Polar integration status", async ({ page }) => {
    await expect(page.getByText(/polar/i).first()).toBeVisible({ timeout: 5000 });
  });
});
