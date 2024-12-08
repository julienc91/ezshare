import { test, expect } from '@playwright/test'
import { APP_URL } from './utils'

test('Download page with no uploader', async ({ page }) => {
  await page.goto(`${APP_URL}/download/0000-0000-00000000-0000/`)
  await expect(
    page.getByRole('heading', { name: 'Waiting for connection', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(
      "We're waiting for the uploader to establish the connection.",
    ),
  ).toBeVisible()
})
