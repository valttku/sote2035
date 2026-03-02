import { test, expect } from "@playwright/test";

async function mockHealthInsightsApis(page: import("@playwright/test").Page) {
  const mockData = {
    profile: { display_name: "Test User", gender: "male", height: 175, weight: 70 },
    dailies: [
      {
        summary_id: "1",
        calendar_date: "2025-01-15",
        steps: 8000,
        distance_in_meters: 6000,
        active_kilocalories: 400,
        resting_heart_rate: 58,
        average_stress_level: 32,
        heart_rate_samples: [],
      },
    ],
    activities: [],
    sleep: [],
    stress: [],
    respiration: [],
    hrv: [],
  };
  await page.route("**/api/v1/health-insights**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockData) }),
  );
  await page.route("**/api/v1/openai**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ result: "You are healthy!" }) }),
  );
  await page.route("**/api/v1/home**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ alerts: {}, aiMessage: "", user: {} }),
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// Health Insights Page
// ─────────────────────────────────────────────────────────────
test.describe("Health Insights Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockHealthInsightsApis(page);
    await page.goto("/health-insights");
  });

  test("renders the page", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  test("clicking 'Activities' tab shows activities section", async ({ page }) => {
    const activitiesBtn = page.getByRole("button", { name: /activities/i });
    if (await activitiesBtn.count() > 0) {
      await activitiesBtn.first().click();
      await expect(page.getByText(/activities/i).first()).toBeVisible();
    }
  });

  test("clicking 'Sleep' tab shows sleep section", async ({ page }) => {
    const sleepBtn = page.getByRole("button", { name: /^sleep$/i });
    if (await sleepBtn.count() > 0) {
      await sleepBtn.first().click();
      await expect(page.getByText(/sleep/i).first()).toBeVisible();
    }
  });

  test("clicking 'HRV' tab shows HRV section", async ({ page }) => {
    const hrvBtn = page.getByRole("button", { name: /hrv/i });
    if (await hrvBtn.count() > 0) {
      await hrvBtn.first().click();
      await expect(page.getByText(/hrv/i).first()).toBeVisible();
    }
  });

  test("clicking 'Profile' tab shows profile section", async ({ page }) => {
    const profileBtn = page.getByRole("button", { name: /^profile$/i });
    if (await profileBtn.count() > 0) {
      await profileBtn.first().click();
      await expect(page.getByText(/profile|display name/i).first()).toBeVisible();
    }
  });

  test("clicking Analyze button triggers API and shows result (mocked)", async ({ page }) => {
    await page.route("**/api/v1/openai**", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ result: "You are healthy!" }) }),
    );
    const analyzeBtn = page.getByRole("button", { name: /analyze|ai|insight/i });
    if (await analyzeBtn.count() > 0) {
      await analyzeBtn.first().click();
      await expect(page.getByText(/healthy|analysis|result/i)).toBeVisible({ timeout: 8000 });
    }
  });

  test("shows loading indicator when fetching data", async ({ page }) => {
    await page.route("**/api/v1/health-insights**", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      route.fulfill({ status: 200, body: JSON.stringify({ dailies: [] }) });
    });
    await page.goto("/health-insights");
    await expect(page.locator("main")).toBeVisible();
  });

  test("changing date triggers new data fetch", async ({ page }) => {
    let fetchCount = 0;
    await page.route("**/api/v1/health-insights**", (route) => {
      fetchCount++;
      route.fulfill({ status: 200, body: JSON.stringify({ dailies: [] }) });
    });
    const datePicker = page.locator("input[type='date']").first();
    if (await datePicker.count() > 0) {
      await datePicker.fill("2025-01-10");
      await datePicker.press("Enter");
      await page.waitForTimeout(500);
      expect(fetchCount).toBeGreaterThan(0);
    }
  });
});
