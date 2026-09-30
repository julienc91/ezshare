import { Page } from '@playwright/test'
import * as path from 'node:path'

export const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'
export const ROOM_ID_REGEX =
  /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/

// Reads the share code from the download link the uploader displays
export const getRoomId = async (page: Page): Promise<string> => {
  const url = await page.getByLabel('Your download link').inputValue()
  return url.match(/\/d\/([^/]+)\/$/)![1]
}

export const uploadFile = async (page: Page, params?: { roomId: string }) => {
  let url = `${APP_URL}/`
  if (params?.roomId) {
    url = `${url}?__playwright_room_id=${params.roomId}`
  }
  await page.goto(url)
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Select a file' }).click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(path.join(__dirname, 'image.jpg'))
}

export const startUpload = async (page: Page, params?: { roomId: string }) => {
  await uploadFile(page, params)
  await page.getByRole('button', { name: 'Start sharing' }).click()
}
