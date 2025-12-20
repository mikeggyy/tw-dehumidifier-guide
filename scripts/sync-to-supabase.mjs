/**
 * 同步商品資料到 Supabase (ES Module 版本)
 * 支援所有品類：除濕機、空氣清淨機、冷氣等
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase 配置
const SUPABASE_URL = 'https://tqyefifafabyudtyjfam.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ioNYT5D-3-ZPObp82HK5Yg_EEFwrGD5';

// 品類對應的檔案名稱
const CATEGORY_FILES = {
  'dehumidifier': 'dehumidifiers.json',
  'air-purifier': 'air_purifiers.json',
  'air-conditioner': 'air_conditioners.json',
  'heater': 'heaters.json',
  'fan': 'fans.json',
};

// 將爬蟲資料轉換為 Supabase 格式
// 注意：只使用資料庫中已存在的欄位
function transformProduct(product, categorySlug) {
  const transformed = {
    id: product.id,
    brand: product.brand || 'Other',
    model: product.model || product.brand,
    name: product.name,
    price: product.price,
    original_price: product.original_price || null,
    category_slug: categorySlug,
    image_url: product.image_url,
    affiliate_url: product.momo_url || product.affiliate_url,
    in_stock: product.in_stock !== false,
    slug: `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-'),
    features: product.features || [],
  };

  // 除濕機特殊欄位
  if (categorySlug === 'dehumidifier') {
    transformed.daily_capacity = product.specs?.daily_capacity || product.daily_capacity || null;
    transformed.tank_capacity = product.specs?.tank_capacity || product.tank_capacity || null;
    transformed.noise_level = product.specs?.noise_level || product.noise_level || null;
    transformed.power_consumption = product.specs?.power_consumption || product.power_consumption || null;
    transformed.energy_efficiency = product.specs?.energy_efficiency || product.energy_efficiency || null;
  }

  // 冷氣/空氣清淨機 - 將規格存入 specs JSONB 欄位（如果資料庫支援）
  // 如果沒有 specs 欄位，這些資料會被忽略
  if (categorySlug === 'air-conditioner' || categorySlug === 'air-purifier') {
    transformed.specs = product.specs || {};
  }

  return transformed;
}

// 批次 upsert 到 Supabase
async function upsertProducts(products) {
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(batch),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 失敗:`, error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`批次 ${Math.floor(i / batchSize) + 1} 成功: ${batch.length} 筆`);
      }
    } catch (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 錯誤:`, error.message);
      errorCount += batch.length;
    }

    // 避免請求過快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { successCount, errorCount };
}

// 更新品類狀態為啟用
async function activateCategory(categorySlug) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?slug=eq.${categorySlug}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ is_active: true }),
      }
    );

    if (response.ok) {
      console.log(`品類 ${categorySlug} 已啟用`);
    }
  } catch (error) {
    console.error(`啟用品類 ${categorySlug} 失敗:`, error.message);
  }
}

// 同步單個品類
async function syncCategory(categorySlug) {
  const filename = CATEGORY_FILES[categorySlug];
  if (!filename) {
    console.log(`未知品類: ${categorySlug}`);
    return;
  }

  const filePath = path.join(__dirname, '..', 'data', filename);

  if (!fs.existsSync(filePath)) {
    console.log(`檔案不存在: ${filePath}`);
    return;
  }

  console.log(`\n=== 同步 ${categorySlug} ===`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const products = data.products || [];

  if (products.length === 0) {
    console.log('沒有商品資料');
    return;
  }

  console.log(`讀取到 ${products.length} 筆商品`);

  // 轉換格式
  const transformed = products.map(p => transformProduct(p, categorySlug));

  // 上傳到 Supabase
  const { successCount, errorCount } = await upsertProducts(transformed);

  console.log(`同步完成: 成功 ${successCount} 筆, 失敗 ${errorCount} 筆`);

  // 如果有成功上傳的商品，啟用該品類
  if (successCount > 0) {
    await activateCategory(categorySlug);
  }
}

// 主程式
async function main() {
  const args = process.argv.slice(2);

  console.log('=== 商品資料同步工具 ===');
  console.log(`開始時間: ${new Date().toLocaleString('zh-TW')}`);

  if (args.length === 0) {
    // 同步所有可用的品類
    console.log('同步所有品類...');
    for (const categorySlug of Object.keys(CATEGORY_FILES)) {
      await syncCategory(categorySlug);
    }
  } else {
    // 同步指定品類
    for (const categorySlug of args) {
      await syncCategory(categorySlug);
    }
  }

  console.log('\n=== 同步完成 ===');
}

// 執行
main().catch(console.error);
