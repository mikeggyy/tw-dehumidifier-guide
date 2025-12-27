import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const svgPath = join(__dirname, 'og-image.svg')
const outputPath = join(__dirname, '..', 'public', 'og-image.png')

const svgBuffer = readFileSync(svgPath)

await sharp(svgBuffer)
  .resize(1200, 630)
  .png()
  .toFile(outputPath)

console.log('og-image.png generated successfully!')
console.log('Output:', outputPath)
