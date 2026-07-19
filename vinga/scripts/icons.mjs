/** Renders public/icon.svg into the PNG sizes the PWA manifest needs. */
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const svg = readFileSync(resolve('public/icon.svg'), 'utf8')
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<body style="margin:0"><div style="width:${size}px;height:${size}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`,
  )
  await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: true })
  await page.close()
  console.log(`icon-${size}.png`)
}
await browser.close()
