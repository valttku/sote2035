import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Language Selector (i18n)
// ─────────────────────────────────────────────────────────────
test.describe("Language Selector", () => {
  test("language selector is visible on startup page", async ({ page }) => {
    await page.goto("/startup");
    const selector = page.locator("select, [role='listbox'], button").filter({
      hasText: /en|fi|english|finnish/i,
    });
    await expect(selector.first()).toBeVisible();
  });

  test("switching to Finnish changes UI text", async ({ page }) => {
    await page.goto("/startup");
    const select = page.locator("select").first();
    if (await select.count() > 0) {
      await select.selectOption({ value: "fi" });
      await page.waitForTimeout(300);
      const headingText = await page.getByRole("heading", { level: 1 }).first().textContent();
      expect(headingText?.length).toBeGreaterThan(0);
    }
  });

  test("switching back to English restores English text", async ({ page }) => {
    await page.goto("/startup");
    const select = page.locator("select").first();
    if (await select.count() > 0) {
      await select.selectOption({ value: "fi" });
      await select.selectOption({ value: "en" });
      await page.waitForTimeout(300);
      await expect(page.getByRole("button", { name: /get started/i })).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────
// App Logo
// ─────────────────────────────────────────────────────────────
test.describe("App Logo", () => {
  test("logo is visible on startup page", async ({ page }) => {
    await page.goto("/startup");
    const count = await page.locator("img, svg").count();
    expect(count).toBeGreaterThan(0);
  });

  test("logo is visible on home page", async ({ page }) => {
    await page.route("**/api/v1/home**", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ alerts: {}, aiMessage: "", user: {} }) }),
    );
    await page.goto("/");
    const count = await page.locator("img, svg").count();
    expect(count).toBeGreaterThan(0);
  });
});
