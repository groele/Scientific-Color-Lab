import { expect, test } from '@playwright/test';

test('workspace shell loads', async ({ page }) => {
  await page.goto('/workspace');
  await expect(page.getByText('Scientific Color Lab v2')).toBeVisible();
  await expect(page.getByText('Start from a real workflow')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Palette Canvas')).toBeVisible();
  await expect(page.getByText('High-Frequency Adjustment')).toBeVisible();
});

test('analyzer route loads', async ({ page }) => {
  await page.goto('/analyzer');
  await expect(page.getByText('Import figure or screenshot')).toBeVisible();
  await expect(page.getByText('Load Example Image')).toBeVisible();
});

test('legacy routes redirect into the workspace shell', async ({ page }) => {
  await page.goto('/studio');
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByText('Scientific Color Lab v2')).toBeVisible();

  await page.goto('/generators');
  await expect(page).toHaveURL(/\/workspace\?view=chart-preview$/);
});
