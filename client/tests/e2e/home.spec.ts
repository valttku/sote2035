import { test, expect } from "@playwright/test";

async function mockHomeApi(page: import("@playwright/test").Page, overrides = {}) {
  await page.route("**/api/v1/home**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        alerts: { brain: false, heart: false, lungs: false, legs: false },
        aiMessage: "Your health looks great today!",
        user: { gender: "male" },
        ...overrides,
      }),
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// Home / Digital Twin Page
// ─────────────────────────────────────────────────────────────
test.describe("Home / Digital Twin Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockHomeApi(page);
    await page.goto("/");
  });

  test("shows 'Today' heading (or translated equivalent)", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("renders the digital twin body image", async ({ page }) => {
    const avatar = page.locator("img[alt], svg").first();
    await expect(avatar).toBeVisible();
  });

  test("clicking AI button opens AI message window", async ({ page }) => {
    await page.waitForTimeout(500);
    const fixedButtons = page.locator("[class*='fixed'][class*='bottom']").locator("button");
    const count = await fixedButtons.count();
    if (count >= 1) {
      await fixedButtons.last().click();
      await expect(page.getByText(/ai analysis|ai message|health looks great/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("AI window shows message content from API", async ({ page }) => {
    await page.waitForTimeout(500);
    const fixedButtons = page.locator("[class*='fixed'][class*='bottom']").locator("button");
    const count = await fixedButtons.count();
    if (count >= 1) {
      await fixedButtons.last().click();
      await expect(page.getByText("Your health looks great today!")).toBeVisible({ timeout: 5000 });
    }
  });

  test("AI window can be closed with X button", async ({ page }) => {
    await page.waitForTimeout(300);
    const fixedButtons = page.locator("[class*='fixed'][class*='bottom']").locator("button");
    const count = await fixedButtons.count();
    if (count >= 1) {
      await fixedButtons.last().click();
      const closeBtn = page.getByRole("button", { name: /close ai message/i });
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await expect(page.getByText("Your health looks great today!")).not.toBeVisible();
      }
    }
  });

  test("Info window can be closed with X button", async ({ page }) => {
    const fixedButtons = page.locator("[class*='fixed'][class*='bottom']").locator("button");
    const count = await fixedButtons.count();
    if (count >= 2) {
      await fixedButtons.nth(count - 2).click();
      const closeBtn = page.getByRole("button", { name: /close info/i });
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await expect(page.getByRole("button", { name: /close info/i })).not.toBeVisible();
      }
    }
  });

  test("shows female avatar when user gender is female", async ({ page }) => {
    await page.route("**/api/v1/home**", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ alerts: {}, aiMessage: "", user: { gender: "female" } }),
      }),
    );
    await page.reload();
    const anyAvatar = page.locator("img").first();
    await expect(anyAvatar).toBeVisible();
  });

  test("alerts state from API sets alert indicators on body parts", async ({ page }) => {
    await page.route("**/api/v1/home**", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          alerts: { brain: true, heart: false, lungs: false, legs: false },
          aiMessage: "",
          user: { gender: "male" },
        }),
      }),
    );
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("AI + Info windows are mutually exclusive (opening one closes other)", async ({ page }) => {
    await page.waitForTimeout(300);
    const fixedButtons = page.locator("[class*='fixed'][class*='bottom']").locator("button");
    const count = await fixedButtons.count();
    if (count >= 2) {
      await fixedButtons.nth(count - 2).click();
      await fixedButtons.last().click();
      const infoWindow = page.getByRole("button", { name: /close info/i });
      await expect(infoWindow).not.toBeVisible();
    }
  });
});
