import { test, expect } from '@playwright/test'
import { APP_URL, ROOM_ID_REGEX } from './utils'
import * as fs from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'

// Transfer benchmark, skipped unless BENCHMARK is set:
//   BENCHMARK=1 BENCHMARK_SIZES_MB=1,100 npx playwright test benchmark
const sizesMb = (process.env.BENCHMARK_SIZES_MB ?? '1,100')
  .split(',')
  .map(Number)

test.describe('Benchmark', () => {
  test.skip(!process.env.BENCHMARK, 'BENCHMARK is not set')

  for (const sizeMb of sizesMb) {
    test(`Transfer ${sizeMb}MB`, async ({ context }, testInfo) => {
      test.setTimeout(10 * 60_000)

      const filePath = testInfo.outputPath(`file-${sizeMb}MB.bin`)
      const hashSum = createHash('sha256')
      const fd = fs.openSync(filePath, 'w')
      for (let written = 0; written < sizeMb * 1024 ** 2;) {
        const chunk = randomBytes(
          Math.min(16 * 1024 ** 2, sizeMb * 1024 ** 2 - written),
        )
        fs.writeSync(fd, chunk)
        hashSum.update(chunk)
        written += chunk.byteLength
      }
      fs.closeSync(fd)
      const expectedHash = hashSum.digest('hex')

      const uploaderPage = await context.newPage()
      await uploaderPage.goto(`${APP_URL}/`)
      const fileChooserPromise = uploaderPage.waitForEvent('filechooser')
      await uploaderPage.getByRole('button', { name: 'Select a file' }).click()
      await (await fileChooserPromise).setFiles(filePath)
      await uploaderPage.getByRole('button', { name: 'Start sharing' }).click()
      const roomId = await uploaderPage
        .getByRole('link', { name: ROOM_ID_REGEX, exact: true })
        .textContent()

      const downloaderPage = await context.newPage()
      const connectStart = Date.now()
      await downloaderPage.goto(`${APP_URL}/download/${roomId}/`)
      const startButton = uploaderPage.getByRole('button', {
        name: 'Start',
        exact: true,
      })
      await startButton.click({ timeout: 60_000 })
      const downloadButton = downloaderPage.getByRole('button', {
        name: 'Download',
        exact: true,
      })
      await expect(downloadButton).toBeVisible({ timeout: 60_000 })
      const connectMs = Date.now() - connectStart

      const transferStart = Date.now()
      await downloadButton.click()
      await expect(
        downloaderPage.getByRole('heading', { name: 'Download complete' }),
      ).toBeVisible({ timeout: 10 * 60_000 })
      const transferMs = Date.now() - transferStart

      const blobUrl = await downloaderPage
        .locator('.save-link a')
        .evaluate((e: HTMLAnchorElement) => e.href)
      const receivedHash = await downloaderPage.evaluate(async (url) => {
        const buffer = await (await fetch(url)).arrayBuffer()
        const digest = await window.crypto.subtle.digest('SHA-256', buffer)
        return Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      }, blobUrl)
      expect(receivedHash).toEqual(expectedHash)

      const throughput = sizeMb / (transferMs / 1000)
      const result = `[${testInfo.project.name}] ${sizeMb}MB: connect ${connectMs}ms, transfer ${transferMs}ms (${throughput.toFixed(1)} MB/s)`
      console.log(result)
      testInfo.annotations.push({ type: 'benchmark', description: result })
      fs.rmSync(filePath)
    })
  }
})
