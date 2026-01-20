import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Digital Twin")).toBeVisible();
});

test("protected page redirects when not logged in", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/login|session/i);
});
