/**
 * MOMO 電風扇爬蟲腳本 (使用 Puppeteer)
 * 從 MOMO 購物網抓取電風扇商品資料
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 品牌對照表
const BRAND_MAPPINGS = {
  '禾聯': 'HERAN',
  'heran': 'HERAN',
  '聲寶': 'SAMPO',
  'sampo': 'SAMPO',
  '國際牌': 'Panasonic',
  'panasonic': 'Panasonic',
  '艾美特': 'AIRMATE',
  'airmate': 'AIRMATE',
  '大同': 'TATUNG',
  'tatung': 'TATUNG',
  '東元': 'TECO',
  'teco': 'TECO',
  '歌林': 'KOLIN',
  'kolin': 'KOLIN',
  '奇美': 'CHIMEI',
  'chimei': 'CHIMEI',
  '日立': 'HITACHI',
  'hitachi': 'HITACHI',
  '三菱': 'MITSUBISHI',
  'mitsubishi': 'MITSUBISHI',
  '戴森': 'Dyson',
  'dyson': 'Dyson',
  '正負零': 'PLUS MINUS ZERO',
  '小米': 'Xiaomi',
  'xiaomi': 'Xiaomi',
  '百慕達': 'BALMUDA',
  'balmuda': 'BALMUDA',
  '安晴': 'ANQUEEN',
  'anqueen': 'ANQUEEN',
  '北方': 'NORTHERN',
  'northern': 'NORTHERN',
  '友情牌': 'YOHING',
  '中央牌': 'CENTRAL',
  '勳風': 'SUPA FINE',
  '華冠': 'HUA GUAN',
  '山多力': 'SANDOLI',
  'iris': 'IRIS',
  'honeywell': 'Honeywell',
  '尚朋堂': 'SPT',
  'spt': 'SPT',
  '嘉儀': 'HELLER',
};

// 從商品名稱中提取品牌
function extractBrand(name) {
  const lowerName = name.toLowerCase();

  // 先嘗試從【】中提取
  const bracketMatch = name.match(/【([^】]+)】/);
  if (bracketMatch) {
    const bracketContent = bracketMatch[1].toLowerCase();
    for (const [key, value] of Object.entries(BRAND_MAPPINGS)) {
      if (bracketContent.includes(key.toLowerCase())) {
        return value;
      }
    }
  }

  // 再從整個名稱中尋找
  for (const [key, value] of Object.entries(BRAND_MAPPINGS)) {
    if (lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'Other';
}

// 從商品名稱中提取型號
function extractModel(name, brand) {
  const patterns = [
    /([A-Z]{2,}[-]?[A-Z0-9]+[-]?[A-Z0-9]*)/i,
    /型號[：:]?\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return brand;
}

// 從商品名稱中提取規格
function extractSpecs(name) {
  const specs = {
    fan_type: 'stand',
    blade_size: null,
    motor_type: 'ac',
    oscillation: false,
    remote_control: false,
    timer: false,
    speed_levels: null,
  };

  // 風扇類型判斷
  if (name.includes('大廈扇') || name.includes('塔扇') || name.includes('直立扇')) {
    specs.fan_type = 'tower';
  } else if (name.includes('桌扇') || name.includes('桌上') || name.includes('小風扇')) {
    specs.fan_type = 'desk';
  } else if (name.includes('循環扇') || name.includes('循環')) {
    specs.fan_type = 'circulator';
  } else if (name.includes('吊扇') || name.includes('吸頂')) {
    specs.fan_type = 'ceiling';
  } else if (name.includes('壁扇') || name.includes('壁掛')) {
    specs.fan_type = 'wall';
  } else if (name.includes('工業扇') || name.includes('工業')) {
    specs.fan_type = 'industrial';
  }

  // 扇葉尺寸
  const sizeMatch = name.match(/(\d+)[吋寸"]/);
  if (sizeMatch) {
    specs.blade_size = parseInt(sizeMatch[1]);
  }

  // 馬達類型
  if (name.includes('DC') || name.includes('直流') || name.includes('dc')) {
    specs.motor_type = 'dc';
  }

  // 擺頭功能
  if (name.includes('擺頭') || name.includes('廣角') || name.includes('旋轉') || name.includes('3D')) {
    specs.oscillation = true;
  }

  // 遙控功能
  if (name.includes('遙控')) {
    specs.remote_control = true;
  }

  // 定時功能
  if (name.includes('定時') || name.includes('預約')) {
    specs.timer = true;
  }

  // 風速段數
  const speedMatch = name.match(/(\d+)段/);
  if (speedMatch) {
    specs.speed_levels = parseInt(speedMatch[1]);
  }

  return specs;
}

// 從商品名稱中提取特色
function extractFeatures(name) {
  const features = [];
  const lowerName = name.toLowerCase();

  const featureKeywords = {
    '遙控': '遙控功能',
    '定時': '定時功能',
    '擺頭': '自動擺頭',
    '直流': 'DC直流馬達',
    'dc': 'DC直流馬達',
    '靜音': '超靜音',
    '省電': '省電節能',
    '自然風': '自然風模式',
    '睡眠': '睡眠風模式',
    '負離子': '負離子功能',
    '3d': '3D立體擺頭',
    '觸控': '觸控面板',
    'led': 'LED顯示',
    '折疊': '可折疊收納',
    '伸縮': '高度可調',
  };

  for (const [keyword, feature] of Object.entries(featureKeywords)) {
    if (lowerName.includes(keyword)) {
      features.push(feature);
    }
  }

  return [...new Set(features)];
}

// 生成 MOMO 圖片 URL
function getMomoImageUrl(productId) {
  const id = String(productId);
  const padded = id.padStart(8, '0');
  const part1 = padded.slice(0, 2).padStart(4, '0');
  const part2 = padded.slice(2, 5);
  const part3 = padded.slice(5, 8);
  return `https://i3.momoshop.com.tw/1700000000/goodsimg/${part1}/${part2}/${part3}/${id}_R.webp`;
}

// 從分類頁面抓取
async function scrapeCategory(browser, categoryCode, categoryName) {
  const products = [];
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 最多抓 5 頁
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      const url = `https://www.momoshop.com.tw/category/DgrpCategory.jsp?d_code=${categoryCode}&curPage=${pageNum}&showType=chess498`;
      console.log(`Fetching ${categoryName} page ${pageNum}...`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 等待商品列表載入
      await page.waitForSelector('.goodsItemLi, .prdListLi, li[data-goodscode], a[href*="i_code"]', { timeout: 10000 }).catch(() => null);

      // 滾動頁面
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 提取商品
      const pageProducts = await page.evaluate(() => {
        const items = [];
        const seen = new Set();

        // 嘗試多種選擇器
        const productCards = document.querySelectorAll('.goodsItemLi, .prdListLi, li[data-goodscode], .productItem');

        productCards.forEach(card => {
          try {
            const link = card.querySelector('a[href*="i_code="]');
            const goodsCode = card.getAttribute('data-goodscode');

            let id = null;
            if (goodsCode) {
              id = goodsCode;
            } else if (link) {
              const match = link.href.match(/i_code=(\d+)/);
              if (match) id = match[1];
            }

            if (!id || seen.has(id)) return;
            seen.add(id);

            const nameEl = card.querySelector('.prdName, .goodsName, .prodTitle, [class*="name"]');
            const name = nameEl ? nameEl.textContent.trim() : '';

            const priceEl = card.querySelector('.price, .priceNum, [class*="price"]');
            let price = null;
            if (priceEl) {
              const priceText = priceEl.textContent.replace(/[,$\s元]/g, '');
              const priceMatch = priceText.match(/\d+/);
              if (priceMatch) price = parseInt(priceMatch[0]);
            }

            // 獲取原價
            const originalPriceEl = card.querySelector('.originPrice, .orgPrice, [class*="origin"]');
            let originalPrice = null;
            if (originalPriceEl) {
              const text = originalPriceEl.textContent.replace(/[,$\s元]/g, '');
              const match = text.match(/\d+/);
              if (match) originalPrice = parseInt(match[0]);
            }

            if (name && price > 0) {
              items.push({ id, name, price, original_price: originalPrice });
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        });

        // 也嘗試從連結中提取
        if (items.length === 0) {
          const links = document.querySelectorAll('a[href*="i_code="]');
          links.forEach(link => {
            const match = link.href.match(/i_code=(\d+)/);
            if (!match || seen.has(match[1])) return;

            const id = match[1];
            seen.add(id);

            let container = link.closest('li, .productItem, .goodsItem');
            if (!container) container = link.parentElement;

            const nameEl = container?.querySelector('.prdName, .goodsName, [class*="name"]') || link;
            const name = (nameEl?.textContent || link.textContent || '').trim();

            const priceEl = container?.querySelector('.price, .priceNum, [class*="price"]');
            let price = null;
            if (priceEl) {
              const priceMatch = priceEl.textContent.match(/[\d,]+/);
              if (priceMatch) price = parseInt(priceMatch[0].replace(/,/g, ''));
            }

            if (name && price > 0) {
              items.push({ id, name, price, original_price: null });
            }
          });
        }

        return items;
      });

      console.log(`  Found ${pageProducts.length} products on page ${pageNum}`);
      products.push(...pageProducts);

      if (pageProducts.length < 10) break;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (error) {
    console.error(`Error fetching ${categoryName}:`, error.message);
  } finally {
    await page.close();
  }

  return products;
}

// 主程式
async function main() {
  console.log('=== MOMO 電風扇爬蟲 (Puppeteer) ===');
  console.log(`開始時間: ${new Date().toLocaleString('zh-TW')}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allProducts = new Map();

  try {
    // 電風扇分類代碼 (根據 MOMO 網站結構)
    const categories = [
      { code: '1200700001', name: '立扇' },
      { code: '1200700002', name: '大廈扇/塔扇' },
      { code: '1200700003', name: '桌扇' },
      { code: '1200700004', name: '循環扇' },
      { code: '1200700005', name: '工業扇' },
      { code: '1200700006', name: '壁扇/吊扇' },
      { code: '1200700000', name: '電風扇館' },
    ];

    for (const category of categories) {
      const products = await scrapeCategory(browser, category.code, category.name);
      products.forEach(p => {
        if (!allProducts.has(p.id)) {
          allProducts.set(p.id, p);
        }
      });
      console.log(`Total unique products so far: ${allProducts.size}\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 處理所有商品
    const processedProducts = [];

    for (const product of allProducts.values()) {
      const name = product.name.toLowerCase();

      // 過濾非電風扇產品
      if (
        name.includes('冷氣') ||
        name.includes('空調') ||
        name.includes('除濕') ||
        name.includes('清淨機') ||
        name.includes('暖器') ||
        name.includes('加濕') ||
        name.includes('濾網') ||
        name.includes('扇葉') && !name.includes('風扇') ||
        name.includes('馬達') && !name.includes('風扇')
      ) {
        continue;
      }

      // 確認是電風扇相關產品
      if (
        !name.includes('風扇') &&
        !name.includes('循環扇') &&
        !name.includes('立扇') &&
        !name.includes('桌扇') &&
        !name.includes('塔扇') &&
        !name.includes('大廈扇') &&
        !name.includes('工業扇') &&
        !name.includes('壁扇') &&
        !name.includes('吊扇')
      ) {
        continue;
      }

      // 價格過濾
      if (product.price < 300 || product.price > 50000) {
        continue;
      }

      const brand = extractBrand(product.name);
      const model = extractModel(product.name, brand);
      const specs = extractSpecs(product.name);
      const features = extractFeatures(product.name);

      processedProducts.push({
        id: product.id,
        name: product.name,
        brand,
        model,
        price: product.price,
        original_price: product.original_price,
        specs,
        features,
        image_url: getMomoImageUrl(product.id),
        momo_url: `https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=${product.id}`,
        affiliate_url: `https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=${product.id}`,
        category: 'fan',
      });
    }

    // 按品牌和價格排序
    processedProducts.sort((a, b) => {
      if (a.brand !== b.brand) {
        return a.brand.localeCompare(b.brand);
      }
      return a.price - b.price;
    });

    console.log(`\nProcessed ${processedProducts.length} fan products`);

    // 統計品牌
    const brandStats = {};
    processedProducts.forEach(p => {
      brandStats[p.brand] = (brandStats[p.brand] || 0) + 1;
    });
    console.log('\nBrand distribution:');
    Object.entries(brandStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brand, count]) => {
        console.log(`  ${brand}: ${count}`);
      });

    // 儲存結果
    const outputPath = path.join(__dirname, '..', 'data', 'fans.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      totalProducts: processedProducts.length,
      products: processedProducts,
    }, null, 2));

    console.log(`\nSaved to ${outputPath}`);

  } catch (error) {
    console.error('Scraper error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
