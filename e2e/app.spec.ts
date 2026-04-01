import { expect, test, type Page } from '@playwright/test';

async function continueIntoWorkspace(page: Page) {
  const continueButton = page.getByRole('button', { name: /Continue|继续/ }).first();
  if (await continueButton.count()) {
    await continueButton.click({ force: true });
    await expect(continueButton).toBeHidden();
  }
}

test('workspace -> template -> adjust -> export', async ({ page }) => {
  await page.goto('/workspace?view=templates');
  await expect(page.getByText(/Scientific Color Lab v/i)).toBeVisible();
  await continueIntoWorkspace(page);

  await expect(page.getByRole('heading', { name: 'Template library' })).toBeVisible();
  await page.getByRole('button', { name: 'Apply' }).first().click({ force: true });

  await expect(page.getByText('Palette Canvas')).toBeVisible();
  await page.locator('input[type="number"]').first().fill('240');
  await page.goto('/exports');

  await expect(page).toHaveURL(/\/exports$/);
  await expect(page.getByText('Export preview')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Source selection' }).first()).toBeVisible();
});

test('analyzer -> detail layer -> adopt palette -> workspace', async ({ page }) => {
  await page.goto('/analyzer');
  await expect(page.getByText('Import figure or screenshot')).toBeVisible();

  await page.getByRole('button', { name: 'Load example image' }).click();
  await expect(page.getByText('Suggested palettes')).toBeVisible({ timeout: 20000 });

  await page.locator('label:has-text("View") select').selectOption('detail');
  await expect(page.getByText('Detail layer').first()).toBeVisible();

  await page.getByRole('button', { name: 'Adopt selected palette' }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByText('Palette Canvas')).toBeVisible();
});

test('language switch persists across refresh', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();

  await page.locator('#language-switcher').first().selectOption('zh-CN');
  await expect(page.getByRole('heading', { name: '偏好设置' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: '偏好设置' })).toBeVisible();
  await expect(page.getByText('设置摘要')).toBeVisible();
});

test('legacy routes redirect into the workspace shell', async ({ page }) => {
  await page.goto('/studio');
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByText(/Scientific Color Lab v/i)).toBeVisible();

  await page.goto('/generators');
  await expect(page).toHaveURL(/\/workspace\?view=chart-preview$/);
});
