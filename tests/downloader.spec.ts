import { test, expect } from '@playwright/test'
import crypto from 'node:crypto'
import { APP_URL, startUpload } from './utils'

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

test('Download page times out with no uploader', async ({ page }) => {
  await page.clock.install()
  const roomId = crypto.randomBytes(8).toString('hex').toUpperCase()
  await page.goto(`${APP_URL}/download/${roomId}/`)
  await expect(
    page.getByRole('heading', { name: 'Waiting for connection', exact: true }),
  ).toBeVisible()

  await page.clock.fastForward('00:16')
  await expect(
    page.getByRole('heading', { name: 'No file shared', exact: true }),
  ).toBeVisible()
})

test('Uploader joins after the timeout', async ({ page, context }) => {
  const roomId = crypto.randomBytes(8).toString('hex').toUpperCase()
  const downloaderPage = await context.newPage()
  await downloaderPage.clock.install()
  await downloaderPage.goto(`${APP_URL}/download/${roomId}/`)
  await downloaderPage.clock.fastForward('00:16')
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'No file shared',
      exact: true,
    }),
  ).toBeVisible()

  await startUpload(page, { roomId })
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Waiting for connection',
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Ready to download',
      exact: true,
    }),
  ).toBeVisible()
})
