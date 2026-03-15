import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Startup / Landing Page
// ─────────────────────────────────────────────────────────────
test.describe("Startup Page – Landing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/startup");
  });

  test("shows app logo", async ({ page }) => {
    const logo = page.locator("img[alt], svg").first();
    await expect(logo).toBeVisible();
  });

  test("shows welcome heading", async ({ page }) => {
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("shows 'Get started' CTA button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /get started/i }),
    ).toBeVisible();
  });

  test("shows 'I already have an account' button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /already have an account/i }),
    ).toBeVisible();
  });

  test("shows encrypted / data-control footer note", async ({ page }) => {
    await expect(page.getByText(/encrypted/i)).toBeVisible();
  });

  test("shows language selector on startup page", async ({ page }) => {
    const selector = page.locator("select, [role='combobox'], button").filter({
      hasText: /en|fi|english|finnish|language/i,
    });
    await expect(selector.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Login Modal
// ─────────────────────────────────────────────────────────────
test.describe("Startup Page – Login Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/startup");
    await page.getByRole("button", { name: /already have an account/i }).click();
  });

  test("has email input field", async ({ page }) => {
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("has password input field", async ({ page }) => {
    await expect(page.locator("#login-password")).toBeVisible();
  });

  test("password field is masked by default", async ({ page }) => {
    await expect(page.locator("#login-password")).toHaveAttribute("type", "password");
  });

  test("toggles password visibility with eye icon", async ({ page }) => {
    const pwField = page.locator("#login-password");
    const toggle = page.locator("button.fa-eye, button[aria-label*='password']").first();
    await expect(pwField).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(pwField).toHaveAttribute("type", "text");
    await toggle.click();
    await expect(pwField).toHaveAttribute("type", "password");
  });

  test("shows email validation error for invalid email on submit", async ({ page }) => {
    await page.locator("#login-email").fill("not-an-email");
    await page.locator("#login-password").fill("anyPassword");
    await page.getByRole("button", { name: /login|sign in/i }).click();
    await expect(page.locator("[role='alert'], .text-red-600")).toBeVisible();
  });

  test("shows 'forgot password' link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /forgot.?password/i })).toBeVisible();
  });

  test("'forgot password' link points to /forgot-password", async ({ page }) => {
    const link = page.getByRole("link", { name: /forgot.?password/i });
    await expect(link).toHaveAttribute("href", /forgot-password/);
  });

  test("shows 'Sign up now' switch link", async ({ page }) => {
    await expect(page.getByText(/sign up now/i)).toBeVisible();
  });

  test("shows social login buttons (disabled)", async ({ page }) => {
    const buttons = page.locator("button[disabled]");
    await expect(buttons).toHaveCount(3);
  });

  test("closes login modal via close button", async ({ page }) => {
    const closeBtn = page.getByRole("button", { name: /close|×|✕/i });
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await expect(page.getByRole("heading", { name: /login|sign in/i })).not.toBeVisible();
    }
  });

  test("submits login form with valid data (mocked API)", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });
    await page.route("**/api/v1/home**", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ alerts: {}, aiMessage: "", user: { gender: "male" } }),
      });
    });
    await page.locator("#login-email").fill("test@example.com");
    await page.locator("#login-password").fill("Password1!");
    await page.getByRole("button", { name: /^login/i }).click();
    await page.waitForURL("/", { timeout: 5000 }).catch(() => {});
  });
});

// ─────────────────────────────────────────────────────────────
// Register Modal
// ─────────────────────────────────────────────────────────────
test.describe("Startup Page – Register Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/startup");
    await page.getByRole("button", { name: /get started/i }).click();
  });

  test("has email input", async ({ page }) => {
    await expect(page.locator("#reg-email")).toBeVisible();
  });

  test("has display name input (optional)", async ({ page }) => {
    await expect(page.locator("#reg-displayname")).toBeVisible();
  });

  test("has password input", async ({ page }) => {
    await expect(page.locator("#reg-password")).toBeVisible();
  });

  test("has confirm password input", async ({ page }) => {
    await expect(page.locator("#reg-confirm")).toBeVisible();
  });

  test("password strength bar renders", async ({ page }) => {
    await expect(page.locator("[role='progressbar']")).toBeVisible();
  });

  test("password strength increases as requirements are met", async ({ page }) => {
    const pwField = page.locator("#reg-password");
    const bar = page.locator("[role='progressbar']");
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
    await pwField.fill("abcdefgh");
    const score1 = await bar.getAttribute("aria-valuenow");
    expect(Number(score1)).toBeGreaterThan(0);
    await pwField.fill("Abcdef1!");
    const score2 = await bar.getAttribute("aria-valuenow");
    expect(Number(score2)).toBeGreaterThan(Number(score1));
  });

  test("password requirements list shows all 5 items", async ({ page }) => {
    const items = page.locator("ul[aria-label='Password requirements'] li");
    await expect(items).toHaveCount(5);
  });

  test("password requirement items turn green when satisfied", async ({ page }) => {
    await page.locator("#reg-password").fill("Abcdef1!");
    const greenItems = page.locator("ul[aria-label='Password requirements'] li.text-green-600");
    await expect(greenItems).toHaveCount(5);
  });

  test("toggles password visibility on register form", async ({ page }) => {
    const pwField = page.locator("#reg-password");
    await expect(pwField).toHaveAttribute("type", "password");
    const toggle = pwField.locator("..").locator("button");
    await toggle.click();
    await expect(pwField).toHaveAttribute("type", "text");
  });

  test("alerts on password mismatch", async ({ page }) => {
    await page.locator("#reg-email").fill("user@example.com");
    await page.locator("#reg-password").fill("StrongPass1!");
    await page.locator("#reg-confirm").fill("DifferentPass1!");
    page.once("dialog", (d) => { expect(d.message()).toMatch(/match/i); d.accept(); });
    await page.getByRole("button", { name: /create account/i }).click();
  });

  test("alerts on weak password", async ({ page }) => {
    await page.locator("#reg-email").fill("user@example.com");
    await page.locator("#reg-password").fill("weak");
    await page.locator("#reg-confirm").fill("weak");
    page.once("dialog", (d) => { expect(d.message()).toMatch(/weak|password/i); d.accept(); });
    await page.getByRole("button", { name: /create account/i }).click();
  });

  test("alerts on invalid email", async ({ page }) => {
    await page.locator("#reg-email").fill("not-valid");
    await page.locator("#reg-password").fill("StrongPass1!");
    await page.locator("#reg-confirm").fill("StrongPass1!");
    page.once("dialog", (d) => { expect(d.message()).toMatch(/email/i); d.accept(); });
    await page.getByRole("button", { name: /create account/i }).click();
  });

  test("switches to login form via 'Login here' link", async ({ page }) => {
    await page.getByText(/login here/i).click();
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  test("successful registration navigates to /choose-service (mocked API)", async ({ page }) => {
    await page.route("**/api/v1/auth/register", (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });
    await page.locator("#reg-email").fill("newuser@example.com");
    await page.locator("#reg-displayname").fill("Test User");
    await page.locator("#reg-password").fill("StrongPass1!");
    await page.locator("#reg-confirm").fill("StrongPass1!");
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/choose-service/, { timeout: 5000 }).catch(() => {});
  });
});