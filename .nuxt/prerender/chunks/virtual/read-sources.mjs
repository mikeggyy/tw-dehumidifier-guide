import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { readFile } from 'node:fs/promises';
import { join } from 'file://D:/project/tw-dehumidifier-guide/node_modules/pathe/dist/index.mjs';

async function readSourcesFromFilesystem(filename) {
  if (!true) {
    return null
  }
  const path = join("D:\\project\\tw-dehumidifier-guide\\node_modules\\.cache\\nuxt\\sitemap", filename);
  const data = await readFile(path, 'utf-8').catch(() => null);
  return data ? JSON.parse(data) : null
}

export { readSourcesFromFilesystem };
//# sourceMappingURL=read-sources.mjs.map
