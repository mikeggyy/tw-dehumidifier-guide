/**
 * 將規格資料同步到 Supabase
 */
const fs = require('fs');
const path = require('path');

// Supabase 配置
const SUPABASE_URL = "https://tqyefifafabyudtyjfam.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "sb_secret_WVzGlclejkkoWtU8XJNk_A_dzUYekwu";

// 讀取規格資料
const specsPath = path.join(__dirname, '../data/specs_enrichment.json');
const specsData = JSON.parse(fs.readFileSync(specsPath, 'utf8'));

console.log('=== 同步規格資料到 Supabase ===\n');

// 建立型號對照表
const specsMap = {};
for (const [brand, models] of Object.entries(specsData.brands)) {
  for (const [model, specs] of Object.entries(models)) {
    specsMap[model] = { brand, specs };
    specsMap[model.replace(/-/g, '')] = { brand, specs };
    specsMap[model.toLowerCase()] = { brand, specs };
  }
}

console.log(`已載入 ${Object.keys(specsMap).length} 個型號的規格資料\n`);

async function fetchProducts() {
  const url = `${SUPABASE_URL}/rest/v1/products?category_slug=eq.dehumidifier&select=*`;
  console.log('Fetching from:', url);

  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Response:', text);
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function updateProduct(id, data) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    }
  );

  return response.ok;
}

function findMatchingSpecs(product) {
  // 1. 直接匹配 model
  if (specsMap[product.model]) {
    return specsMap[product.model].specs;
  }

  // 2. 從名稱中提取型號匹配
  const modelMatch = product.name.match(/[A-Z]{1,3}[-]?[A-Z0-9]{2,}[-]?[A-Z0-9]*/gi);
  if (modelMatch) {
    for (const m of modelMatch) {
      if (specsMap[m]) return specsMap[m].specs;
      const cleanModel = m.replace(/-/g, '');
      if (specsMap[cleanModel]) return specsMap[cleanModel].specs;
    }
  }

  return null;
}

async function main() {
  try {
    console.log('正在從 Supabase 獲取商品資料...');
    const products = await fetchProducts();
    console.log(`獲取到 ${products.length} 個除濕機商品\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const matchedSpecs = findMatchingSpecs(product);

      if (!matchedSpecs) {
        skippedCount++;
        continue;
      }

      // 準備更新資料
      const updateData = {};
      let hasUpdate = false;

      // 更新頂層欄位
      if (matchedSpecs.power_consumption && !product.power_consumption) {
        updateData.power_consumption = matchedSpecs.power_consumption;
        hasUpdate = true;
      }
      if (matchedSpecs.tank_capacity && !product.tank_capacity) {
        updateData.tank_capacity = matchedSpecs.tank_capacity;
        hasUpdate = true;
      }
      if (matchedSpecs.noise_level && !product.noise_level) {
        updateData.noise_level = matchedSpecs.noise_level;
        hasUpdate = true;
      }
      if (matchedSpecs.energy_efficiency && !product.energy_efficiency) {
        updateData.energy_efficiency = matchedSpecs.energy_efficiency;
        hasUpdate = true;
      }
      if (matchedSpecs.coverage_area && !product.coverage_area) {
        updateData.coverage_area = matchedSpecs.coverage_area;
        hasUpdate = true;
      }

      // 更新 specs 物件
      const currentSpecs = product.specs || {};
      const newSpecs = { ...currentSpecs };

      if (matchedSpecs.weight && !currentSpecs.weight) {
        newSpecs.weight = matchedSpecs.weight;
        hasUpdate = true;
      }
      if (matchedSpecs.dimensions && !currentSpecs.dimensions) {
        newSpecs.dimensions = matchedSpecs.dimensions;
        hasUpdate = true;
      }
      if (matchedSpecs.energy_factor && !currentSpecs.energy_factor) {
        newSpecs.energy_factor = matchedSpecs.energy_factor;
        hasUpdate = true;
      }

      if (Object.keys(newSpecs).length > Object.keys(currentSpecs).length) {
        updateData.specs = newSpecs;
      }

      // 更新 features
      if (matchedSpecs.features && matchedSpecs.features.length > 0) {
        const existingFeatures = product.features || [];
        const newFeatures = matchedSpecs.features.filter(f => !existingFeatures.includes(f));
        if (newFeatures.length > 0) {
          updateData.features = [...existingFeatures, ...newFeatures];
          hasUpdate = true;
        }
      }

      if (hasUpdate) {
        const success = await updateProduct(product.id, updateData);
        if (success) {
          updatedCount++;
          if (updatedCount % 20 === 0) {
            console.log(`已更新 ${updatedCount} 個商品...`);
          }
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n=== 完成 ===`);
    console.log(`已更新: ${updatedCount} 個商品`);
    console.log(`跳過: ${skippedCount} 個商品 (無匹配規格或已有資料)`);

  } catch (error) {
    console.error('錯誤:', error.message);
    process.exit(1);
  }
}

main();
