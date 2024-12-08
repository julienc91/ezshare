import { test, expect, Page, BrowserContext } from '@playwright/test'
import { APP_URL, startUpload, ROOM_ID_REGEX } from './utils'
import * as fs from 'node:fs'
import crypto from 'node:crypto'

const setupFlow = async (page: Page, context: BrowserContext) => {
  await startUpload(page)

  const roomId = await page
    .getByRole('link', { name: ROOM_ID_REGEX, exact: true })
    .textContent()

  const downloaderPage = await context.newPage()
  await downloaderPage.goto(`${APP_URL}/download/${roomId}/`)
  return [page, downloaderPage]
}

test('Complete flow', async ({ page, context }) => {
  const [uploaderPage, downloaderPage] = await setupFlow(page, context)

  // Peer joins
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Waiting for connection',
      exact: true,
    }),
  ).toBeVisible()

  // Uploader accepts connection
  const uploadStartButton = uploaderPage.getByRole('button', {
    name: 'Start',
    exact: true,
  })
  await expect(uploadStartButton).toBeVisible()
  await uploadStartButton.click()
  await expect(
    uploaderPage.getByText('Waiting for peer', { exact: true }),
  ).toBeVisible()

  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Ready to download',
      exact: true,
    }),
  ).toBeVisible()
  await expect(downloaderPage.getByText('image.jpg')).toBeVisible()
  await expect(downloaderPage.getByText('2MB')).toBeVisible()

  // Downloader accepts connection
  const downloadStartButton = downloaderPage.getByRole('button', {
    name: 'Download',
    exact: true,
  })
  await expect(downloadStartButton).toBeVisible()
  await downloadStartButton.click()

  // Download complete
  await expect(
    uploaderPage.getByText('Completed', { exact: true }),
  ).toBeVisible()

  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Download complete',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    downloaderPage.getByText(
      'Click the link below to save the file on your computer.',
    ),
  ).toBeVisible()

  // Save file
  const blobLink = downloaderPage.getByRole('link', {
    name: 'image.jpg',
    exact: true,
  })
  await expect(blobLink).toBeVisible()
  // @ts-ignore
  const blobUrl = await blobLink.evaluate((e) => e.href)
  expect(blobUrl).toMatch(/^blob:/)

  const hashSum = crypto.createHash('sha256')
  downloaderPage.on('download', async (download) => {
    const downloadPath = await download.path()
    hashSum.update(fs.readFileSync(downloadPath))
  })

  await blobLink.click()
  await downloaderPage.waitForTimeout(5000)

  expect(hashSum.digest('hex')).toEqual(
    'ce6ae5f5863812ec7d1bd3c403c51ddf471457f13bd575dee3dbd57e15b542eb',
  )
})

test('Downloader disconnects', async ({ page, context }) => {
  const [uploaderPage, downloaderPage] = await setupFlow(page, context)

  const uploadStartButton = uploaderPage.getByRole('button', {
    name: 'Start',
    exact: true,
  })
  await uploadStartButton.click()
  await expect(
    uploaderPage.getByText('Waiting for peer', { exact: true }),
  ).toBeVisible()

  await downloaderPage.close({ runBeforeUnload: true })
  await downloaderPage.close()
  expect(downloaderPage.isClosed()).toBe(true)

  await expect(
    uploaderPage.getByText('Disconnected', { exact: true }),
  ).toBeVisible()
})

test('Uploader disconnects', async ({ page, context }) => {
  const [uploaderPage, downloaderPage] = await setupFlow(page, context)

  await uploaderPage.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(
    uploaderPage.getByText('Waiting for peer', { exact: true }),
  ).toBeVisible()
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Ready to download',
      exact: true,
    }),
  ).toBeVisible()

  let hasDialog = false
  uploaderPage.on('dialog', async (dialog) => {
    expect(dialog.type()).toBe('beforeunload')
    hasDialog = true
    await dialog.accept()
  })
  await uploaderPage.close({ runBeforeUnload: true })
  await uploaderPage.close()
  expect(uploaderPage.isClosed()).toBe(true)
  expect(hasDialog).toBe(true)

  await expect(
    downloaderPage.getByRole('heading', { name: 'Disconnected', exact: true }),
  ).toBeVisible()
  await expect(
    downloaderPage.getByText('The uploader aborted the transfer.'),
  ).toBeVisible()
})
