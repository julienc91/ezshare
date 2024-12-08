import { Page } from '@playwright/test'
import * as path from 'node:path'

export const APP_URL = 'http://localhost:3000'
export const ROOM_ID_REGEX = /^\w{4}-\w{4}-\w{8}-\w{4}$/

export const uploadFile = async (page: Page) => {
  await page.goto(`${APP_URL}/`)
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Select a file' }).click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(path.join(__dirname, 'image.jpg'))
}

export const startUpload = async (page: Page) => {
  await uploadFile(page)
  await page.getByRole('button', { name: 'Start sharing' }).click()
}
