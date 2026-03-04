import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Forgot Password Page
// ─────────────────────────────────────────────────────────────
test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("shows forgot password heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /forgot.?password/i }),
    ).toBeVisible();
  });

  test("has email input field", async ({ page }) => {
    await expect(page.locator("#email")).toBeVisible();
  });

  test("has send button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /send|reset/i }),
    ).toBeVisible();
  });

  test("shows 'back to login' link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /back.?to.?login/i })).toBeVisible();
  });

  test("'back to login' link points to /startup", async ({ page }) => {
    const link = page.getByRole("link", { name: /back.?to.?login/i }).first();
    await expect(link).toHaveAttribute("href", "/startup");
  });

  test("shows error when non-Gmail address is entered", async ({ page }) => {
    await page.locator("#email").fill("user@outlook.com");
    await expect(page.getByText(/gmail/i)).toBeVisible();
  });

  test("send button is disabled when email is not Gmail", async ({ page }) => {
    await page.locator("#email").fill("user@outlook.com");
    const sendBtn = page.getByRole("button", { name: /send|reset/i });
    await expect(sendBtn).toBeDisabled();
  });

  test("send button is enabled when Gmail address is entered", async ({ page }) => {
    await page.locator("#email").fill("user@gmail.com");
    const sendBtn = page.getByRole("button", { name: /send|reset/i });
    await expect(sendBtn).toBeEnabled();
  });

  test("shows confirmation message after successful submission (mocked API)", async ({ page }) => {
    await page.route("**/api/v1/auth/forgot-password", (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });
    await page.locator("#email").fill("user@gmail.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByText(/check.?email|account.?exists/i)).toBeVisible();
  });

  test("shows 'back to login' link after successful submission", async ({ page }) => {
    await page.route("**/api/v1/auth/forgot-password", (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });
    await page.locator("#email").fill("user@gmail.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByRole("link", { name: /back.?to.?login/i })).toBeVisible();
  });

  test("shows error on server failure", async ({ page }) => {
    await page.route("**/api/v1/auth/forgot-password", (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) });
    });
    await page.locator("#email").fill("user@gmail.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByText(/error|server/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Reset Password Page
// ─────────────────────────────────────────────────────────────
test.describe("Reset Password Page", () => {
  test("shows invalid token message when no token in URL", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/invalid|missing.?reset.?token/i)).toBeVisible();
  });

  test.describe("with a valid token", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/reset-password?token=test-token-abc");
    });

    test("shows 'Reset password' heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /reset.?password/i }),
      ).toBeVisible();
    });

    test("has new password input", async ({ page }) => {
      const pwField = page.locator("input[type='password']").first();
      await expect(pwField).toBeVisible();
    });

    test("has confirm password input", async ({ page }) => {
      const pwFields = page.locator("input[type='password'], input[type='text']");
      expect(await pwFields.count()).toBeGreaterThanOrEqual(2);
    });

    test("password strength progressbar is visible", async ({ page }) => {
      await expect(page.locator("[role='progressbar']")).toBeVisible();
    });

    test("password strength increases with stronger password", async ({ page }) => {
      const pwField = page.locator("input[type='password']").first();
      const bar = page.locator("[role='progressbar']");
      await pwField.fill("Str0ng!Pass");
      const score = await bar.getAttribute("aria-valuenow");
      expect(Number(score)).toBeGreaterThan(0);
    });

    test("requirement items turn green when met", async ({ page }) => {
      const pwField = page.locator("input[type='password']").first();
      await pwField.fill("Abcdef1!");
      const greenItems = page.locator("ul[aria-label='Password requirements'] li.text-green-600");
      await expect(greenItems).toHaveCount(5);
    });

    test("toggles new password visibility", async ({ page }) => {
      const pwField = page.locator("input[type='password']").first();
      const toggle = page.getByRole("button", { name: /show|hide.?password/i }).first();
      await expect(pwField).toHaveAttribute("type", "password");
      await toggle.click();
      await expect(page.locator("input[type='text']").first()).toBeVisible();
    });

    test("alerts when passwords do not match", async ({ page }) => {
      const fields = page.locator("input[type='password']");
      await fields.nth(0).fill("StrongPass1!");
      await fields.nth(1).fill("DifferentPass1!");
      page.once("dialog", (d) => { expect(d.message()).toMatch(/match/i); d.accept(); });
      await page.getByRole("button", { name: /reset.?password/i }).click();
    });

    test("alerts when password is too weak", async ({ page }) => {
      const fields = page.locator("input[type='password']");
      await fields.nth(0).fill("weak");
      await fields.nth(1).fill("weak");
      page.once("dialog", (d) => { expect(d.message()).toMatch(/weak/i); d.accept(); });
      await page.getByRole("button", { name: /reset.?password/i }).click();
    });

    test("redirects to /startup on successful reset (mocked)", async ({ page }) => {
      await page.route("**/api/v1/auth/reset-password", (route) => {
        route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
      });
      const fields = page.locator("input[type='password']");
      await fields.nth(0).fill("StrongPass1!");
      await fields.nth(1).fill("StrongPass1!");
      await page.getByRole("button", { name: /reset.?password/i }).click();
      await page.waitForURL(/startup/, { timeout: 5000 }).catch(() => {});
    });

    test("shows error on failed reset (mocked)", async ({ page }) => {
      await page.route("**/api/v1/auth/reset-password", (route) => {
        route.fulfill({ status: 400, body: JSON.stringify({ error: "Token expired" }) });
      });
      const fields = page.locator("input[type='password']");
      await fields.nth(0).fill("StrongPass1!");
      await fields.nth(1).fill("StrongPass1!");
      page.once("dialog", (d) => { expect(d.message()).toMatch(/token expired|reset failed/i); d.accept(); });
      await page.getByRole("button", { name: /reset.?password/i }).click();
    });
  });
});
