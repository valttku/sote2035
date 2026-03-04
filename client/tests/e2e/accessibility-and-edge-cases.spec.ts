import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Accessibility – Startup Page
// ─────────────────────────────────────────────────────────────
test.describe("Accessibility – Startup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/startup");
  });

  test("page has a single <h1> element", async ({ page }) => {
    const h1s = page.locator("h1");
    expect(await h1s.count()).toBe(1);
  });

  test("all interactive buttons have accessible text or aria-label", async ({ page }) => {
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      const title = await btn.getAttribute("title");
      expect(text?.trim() || ariaLabel || title).toBeTruthy();
    }
  });

  test("login form inputs have associated labels", async ({ page }) => {
    await page.getByRole("button", { name: /already have an account/i }).click();
    const emailLabel = page.locator("label[for='login-email']");
    const pwLabel = page.locator("label[for='login-password']");
    await expect(emailLabel).toBeVisible();
    await expect(pwLabel).toBeVisible();
  });

  test("register form inputs have associated labels", async ({ page }) => {
    await page.getByRole("button", { name: /get started/i }).click();
    const emailLabel = page.locator("label[for='reg-email']");
    const pwLabel = page.locator("label[for='reg-password']");
    const confirmLabel = page.locator("label[for='reg-confirm']");
    await expect(emailLabel).toBeVisible();
    await expect(pwLabel).toBeVisible();
    await expect(confirmLabel).toBeVisible();
  });

  test("password toggle buttons have aria-label", async ({ page }) => {
    await page.getByRole("button", { name: /already have an account/i }).click();
    const toggle = page.locator("button[aria-label*='password']").first();
    await expect(toggle).toBeVisible();
    const ariaLabel = await toggle.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
  });

  test("email error has role='alert'", async ({ page }) => {
    await page.getByRole("button", { name: /already have an account/i }).click();
    await page.locator("#login-email").fill("bad-email");
    await page.locator("#login-password").fill("password");
    await page.getByRole("button", { name: /^login/i }).click();
    await expect(page.locator("[role='alert']")).toBeVisible();
  });

  test("password strength progressbar has correct aria attributes", async ({ page }) => {
    await page.getByRole("button", { name: /get started/i }).click();
    const bar = page.locator("[role='progressbar']");
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "5");
  });

  test("password requirements list has aria-label", async ({ page }) => {
    await page.getByRole("button", { name: /get started/i }).click();
    await expect(
      page.locator("ul[aria-label='Password requirements']"),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Accessibility – Password Pages
// ─────────────────────────────────────────────────────────────
test.describe("Accessibility – Password Pages", () => {
  test("forgot-password: form fields have labels", async ({ page }) => {
    await page.goto("/forgot-password");
    const label = page.locator("label[for='email']");
    await expect(label).toBeVisible();
  });

  test("reset-password: progressbar has aria attributes", async ({ page }) => {
    await page.goto("/reset-password?token=abc123");
    const bar = page.locator("[role='progressbar']");
    await expect(bar).toHaveAttribute("aria-label", "Password strength");
  });

  test("reset-password: password toggle has aria-label", async ({ page }) => {
    await page.goto("/reset-password?token=abc123");
    const toggle = page.getByRole("button", { name: /show|hide.?password/i }).first();
    await expect(toggle).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Responsive Layout
// ─────────────────────────────────────────────────────────────
test.describe("Responsive Layout", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`startup page renders correctly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/startup");
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByRole("button", { name: /get started/i })).toBeVisible();
    });

    test(`forgot-password page renders correctly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/forgot-password");
      await expect(page.locator("main")).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Page Titles
// ─────────────────────────────────────────────────────────────
test.describe("Page Titles", () => {
  test("startup page has a document title", async ({ page }) => {
    await page.goto("/startup");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("forgot-password page has a document title", async ({ page }) => {
    await page.goto("/forgot-password");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("choose-service page has a document title", async ({ page }) => {
    await page.goto("/choose-service");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Error States & Edge Cases
// ─────────────────────────────────────────────────────────────
test.describe("Error States", () => {
  test("home page handles API failure gracefully (no crash)", async ({ page }) => {
    await page.route("**/api/v1/home**", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Internal Server Error" }) }),
    );
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  test("network timeout on login shows error (mocked as network failure)", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => route.abort("failed"));
    await page.goto("/startup");
    await page.getByRole("button", { name: /already have an account/i }).click();
    await page.locator("#login-email").fill("test@example.com");
    await page.locator("#login-password").fill("Password1!");
    page.once("dialog", async (d) => {
      expect(d.message()).toBeTruthy();
      await d.accept();
    });
    await page.getByRole("button", { name: /^login/i }).click();
    await page.waitForTimeout(1000);
  });
});
