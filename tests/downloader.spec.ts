import { test, expect } from '@playwright/test'
import crypto from 'node:crypto'
import { APP_URL } from './utils'

test('Download page with no uploader', async ({ page }) => {
  const roomId = crypto.randomBytes(8).toString('hex').toUpperCase()
  await page.goto(`${APP_URL}/download/${roomId}/`)
  await expect(
    page.getByRole('heading', { name: 'Waiting for connection', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(
      "We're waiting for the uploader to establish the connection.",
    ),
  ).toBeVisible()
})
