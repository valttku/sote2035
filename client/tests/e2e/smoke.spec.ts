import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/startup");
  await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
});

test("protected page redirects when not logged in", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/startup/i);
});