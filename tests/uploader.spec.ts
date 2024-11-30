import { test, expect } from '@playwright/test'
import { APP_URL, startUpload, uploadFile, UUID_REGX } from './utils'

test('Render homepage', async ({ page }) => {
  await page.goto(`${APP_URL}/`)
  await expect(page).toHaveTitle(/ezshare/)
  await expect(page.getByText('Drag the file you want to share')).toBeVisible()
  await expect(page.getByRole('button')).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'Select a file' }),
  ).toBeVisible()
})

test('Init upload', async ({ page }) => {
  await uploadFile(page)
  await expect(page.getByText('image.jpg')).toBeVisible()
  await expect(page.getByText('2MB')).toBeVisible()
  await expect(page.getByRole('button')).toHaveCount(2)
  await expect(
    page.getByRole('button', { name: 'Start sharing' }),
  ).toBeVisible()
  await expect(page.getByTitle('Remove file')).toBeVisible()
})

test('Cancel upload before start', async ({ page }) => {
  await uploadFile(page)

  await page.getByTitle('Remove file').click()
  await expect(page.getByRole('button')).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'Select a file' }),
  ).toBeVisible()

  await expect(page.getByText('image.jpg')).not.toBeVisible()
})

test('Start upload', async ({ page }) => {
  await uploadFile(page)

  await page.getByRole('button', { name: 'Start sharing' }).click()
  await expect(page.getByText('No peers connected')).toBeVisible()
  await expect(
    page.getByText('This link will be valid as long as your tab is open'),
  ).toBeVisible()
})

test('Download link', async ({ page, context }) => {
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  } catch (_e) {
    // Required for Chromium, doesn't work with Firefox
    // https://github.com/microsoft/playwright/issues/13037
  }
  await startUpload(page)

  await expect(page.getByRole('button')).toBeVisible()
  await expect(page.getByRole('button')).toHaveCount(1)

  const getClipboardContent = async () => {
    const handle = await page.evaluateHandle(() =>
      navigator.clipboard.readText(),
    )
    return await handle.jsonValue()
  }

  await page.getByRole('button').click()

  const downloadLink = page.getByRole('link', { name: UUID_REGX, exact: true })
  await expect(downloadLink).toBeVisible()
  const downloadUUID = await downloadLink.textContent()
  // @ts-ignore
  const downloadUrl = await downloadLink.evaluate((e) => e.href)

  const urlRegex = new RegExp(
    String.raw`^${APP_URL}/download/${downloadUUID}/$`,
    'g',
  )
  expect(downloadUrl).toMatch(urlRegex)
  expect(await getClipboardContent()).toEqual(downloadUrl)
})

test('Display QR Code', async ({ page }) => {
  await startUpload(page)

  await expect(page.getByRole('img')).toBeVisible()
  await expect(page.getByRole('img')).toHaveCount(1)
})

test('Disconnect without downloader', async ({ page }) => {
  await startUpload(page)
  let noDialog = true
  page.on('dialog', async (dialog) => {
    noDialog = false
    await dialog.dismiss()
  })
  await page.close({ runBeforeUnload: true })
  expect(noDialog).toBe(true)
})
