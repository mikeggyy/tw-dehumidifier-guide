/**
 * 產生 PNG 格式的 favicon 和 .ico 檔案
 * 使用 puppeteer 將 SVG 渲染成 PNG
 */
import puppeteer from 'puppeteer'
import pngToIco from 'png-to-ico'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// 讀取 SVG 檔案
const svgPath = path.join(publicDir, 'favicon.svg')
const svgContent = fs.readFileSync(svgPath, 'utf-8')

// 需要產生的尺寸
const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

async function generatePNG() {
  console.log('啟動 Puppeteer...')
  const browser = await puppeteer.launch({
    headless: true,
  })

  for (const { name, size } of sizes) {
    console.log(`產生 ${name} (${size}x${size})...`)

    const page = await browser.newPage()
    await page.setViewport({ width: size, height: size })

    // 建立一個包含 SVG 的 HTML 頁面
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; }
            body {
              width: ${size}px;
              height: ${size}px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            svg {
              width: ${size}px;
              height: ${size}px;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `

    await page.setContent(html)

    const outputPath = path.join(publicDir, name)
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: true,
    })

    console.log(`✓ 已產生 ${outputPath}`)
    await page.close()
  }

  await browser.close()

  // 產生 favicon.ico (包含 16x16, 32x32, 48x48)
  console.log('\n產生 favicon.ico...')
  const icoInputs = [
    path.join(publicDir, 'favicon-16.png'),
    path.join(publicDir, 'favicon-32.png'),
    path.join(publicDir, 'favicon-48.png'),
  ]

  const icoBuffer = await pngToIco(icoInputs)
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer)
  console.log(`✓ 已產生 ${path.join(publicDir, 'favicon.ico')}`)

  console.log('\n完成！所有 favicon 圖片已產生。')
}

generatePNG().catch(console.error)
