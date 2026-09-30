import { test, expect, Page, BrowserContext } from '@playwright/test'
import { APP_URL, startUpload } from './utils'
import * as fs from 'node:fs'
import crypto from 'node:crypto'

const setupFlow = async (page: Page, context: BrowserContext) => {
  await startUpload(page)

  const downloadUrl = await page.getByLabel('Your download link').inputValue()

  const downloaderPage = await context.newPage()
  await downloaderPage.goto(downloadUrl)
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
      "Your download should start automatically. If it doesn't:",
    ),
  ).toBeVisible()

  // Save file
  const blobLink = downloaderPage.getByRole('link', {
    name: 'Save image.jpg',
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

test('Several downloaders', async ({ page, context }) => {
  const [uploaderPage, firstDownloaderPage] = await setupFlow(page, context)
  const startButtons = uploaderPage.getByRole('button', {
    name: 'Start',
    exact: true,
  })
  await expect(startButtons).toHaveCount(1)
  const secondDownloaderPage = await context.newPage()
  await secondDownloaderPage.goto(firstDownloaderPage.url())
  await expect(startButtons).toHaveCount(2)

  await startButtons.first().click()
  await startButtons.first().click()

  // Each downloader must get the file, not only the last peer to have joined
  for (const downloaderPage of [firstDownloaderPage, secondDownloaderPage]) {
    await downloaderPage
      .getByRole('button', { name: 'Download', exact: true })
      .click()
    await expect(
      downloaderPage.getByRole('heading', {
        name: 'Download complete',
        exact: true,
      }),
    ).toBeVisible()
  }
  await expect(
    uploaderPage.getByText('Completed', { exact: true }),
  ).toHaveCount(2)
})

test('Room code typed by hand', async ({ page, context }) => {
  // Starts with 0 and 1 so that their look-alike letters are always tested
  const roomId = `011${crypto.randomBytes(7).toString('hex').toUpperCase().slice(1)}`
  await startUpload(page, { roomId })

  // Lowercase, with misplaced dashes, and with look-alike letters instead of digits
  const typedCode = `o-Li${roomId.slice(3, 9).toLowerCase()}-${roomId.slice(9)}`
  const downloaderPage = await context.newPage()
  await downloaderPage.goto(`${APP_URL}/download/${typedCode}/`)

  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Ready to download',
      exact: true,
    }),
  ).toBeVisible()
  await expect(downloaderPage.getByText('image.jpg')).toBeVisible()
})

test('Several peers claim to be the uploader', async ({ page, context }) => {
  // Two uploaders are forced into the same room, as someone who learned
  // the code could do, and both approve the downloader
  const roomId = crypto.randomBytes(8).toString('hex').toUpperCase()
  await startUpload(page, { roomId })
  const downloaderPage = await context.newPage()
  await downloaderPage.goto(`${APP_URL}/download/${roomId}/`)

  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Ready to download',
      exact: true,
    }),
  ).toBeVisible()

  // The second uploader also sees the first one, which ignores its metadata
  const otherUploaderPage = await context.newPage()
  await startUpload(otherUploaderPage, { roomId })
  const startButtons = otherUploaderPage.getByRole('button', {
    name: 'Start',
    exact: true,
  })
  await expect(startButtons).toHaveCount(2)
  await startButtons.first().click()
  await startButtons.first().click()

  await expect(
    downloaderPage.getByRole('heading', {
      name: 'Transfer aborted',
      exact: true,
    }),
  ).toBeVisible()
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

  // Wait for the dialog instead of force-closing the page right away:
  // Firefox dispatches it asynchronously and a second close() would skip it
  const dialogPromise = uploaderPage.waitForEvent('dialog')
  const closePromise = uploaderPage.waitForEvent('close')
  await uploaderPage.close({ runBeforeUnload: true })
  const dialog = await dialogPromise
  expect(dialog.type()).toBe('beforeunload')
  await dialog.accept()
  await closePromise
  expect(uploaderPage.isClosed()).toBe(true)

  await expect(
    downloaderPage.getByRole('heading', { name: 'Disconnected', exact: true }),
  ).toBeVisible()
  await expect(
    downloaderPage.getByText('The uploader aborted the transfer.'),
  ).toBeVisible()
})

test('Switch theme', async ({ page }) => {
  await page.goto(`${APP_URL}/`)
  const toggler = page.getByRole('button', { name: 'Change theme' })
  await expect(toggler).toBeVisible()

  const locator = page.locator('[data-theme="dark"]')
  await expect(locator).toHaveCount(0)

  await toggler.click()
  await expect(locator).toHaveCount(1)

  await toggler.click()
  await expect(locator).toHaveCount(0)
})
