import { test, expect } from '@playwright/test';

async function completeQuiz(page) {
  await page.getByRole('button', { name: 'Energy Boost' }).click();
  await page.getByRole('button', { name: 'Vegan' }).click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: 'Sweet & Fruity' }).click();
  await page.getByRole('button', { name: 'Morning Boost' }).click();
  await page.getByRole('button', { name: 'Motivated' }).click();
}

test('completes the quiz and renders a recommendation card', async ({ page }) => {
  let payload;
  await page.route('**/api/recommend', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Sunrise Fuel',
        tagline: 'Bright citrus energy without the crash.',
        ingredients: [
          { amount: '1 cup', item: 'Mango' },
          { amount: '1 scoop', item: 'Pea protein' }
        ],
        benefits: ['Supports morning energy', 'Fits a vegan routine'],
        upsell: { item: 'Chia boost', reason: 'Adds fiber and lasting satiety.' },
        nextVisit: 'Try a tart version with pineapple next time.'
      }),
    });
  });

  await page.goto('/');
  await completeQuiz(page);

  await expect(page.getByText('Sunrise Fuel')).toBeVisible();
  await expect(page.getByText('Supports morning energy')).toBeVisible();
  expect(payload.answers.goal).toBe('Energy Boost');
  expect(payload.answers.restrictions).toContain('Vegan');
});

test('try another requests an alternate recommendation', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/recommend', async route => {
    calls += 1;
    const payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(calls === 1
        ? {
            name: 'Sunrise Fuel',
            tagline: 'Bright citrus energy.',
            ingredients: [{ amount: '1 cup', item: 'Mango' }],
            benefits: ['Supports morning energy'],
          }
        : {
            name: payload.tryAnother ? 'Green Voltage' : 'Unexpected',
            tagline: 'A greener second option.',
            ingredients: [{ amount: '1 cup', item: 'Spinach' }],
            benefits: ['Keeps the same goal with a new flavor'],
          }),
    });
  });

  await page.goto('/');
  await completeQuiz(page);
  await page.getByRole('button', { name: /Try Another/i }).click();

  await expect(page.getByText('Green Voltage')).toBeVisible();
});

test('API failures show the retry state', async ({ page }) => {
  await page.route('**/api/recommend', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'nope' }),
    });
  });

  await page.goto('/');
  await completeQuiz(page);

  await expect(page.getByText('Failed to get recommendation')).toBeVisible();
  await expect(page.getByRole('button', { name: /Try again/i })).toBeVisible();
});
