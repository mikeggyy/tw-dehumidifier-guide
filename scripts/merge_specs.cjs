/**
 * 將搜尋到的規格資料整合到 products.json
 */
const fs = require('fs');
const path = require('path');

// 讀取檔案
const productsPath = path.join(__dirname, '../data/products.json');
const specsPath = path.join(__dirname, '../data/specs_enrichment.json');

const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const specsData = JSON.parse(fs.readFileSync(specsPath, 'utf8'));

console.log('=== 規格整合腳本 ===\n');
console.log(`原始商品數量: ${productsData.products.length}`);

let updatedCount = 0;
let matchedModels = {};

// 建立型號對照表
const specsMap = {};
for (const [brand, models] of Object.entries(specsData.brands)) {
  for (const [model, specs] of Object.entries(models)) {
    // 使用多種匹配方式
    specsMap[model] = { brand, specs };
    specsMap[model.replace(/-/g, '')] = { brand, specs };
    specsMap[model.toLowerCase()] = { brand, specs };
  }
}

// 遍歷商品並更新規格
productsData.products.forEach(product => {
  if (product.category_slug !== 'dehumidifier') return;

  // 嘗試匹配型號
  let matchedSpecs = null;
  let matchedModel = null;

  // 1. 直接匹配 model
  if (specsMap[product.model]) {
    matchedSpecs = specsMap[product.model].specs;
    matchedModel = product.model;
  }

  // 2. 從名稱中提取型號匹配
  if (!matchedSpecs) {
    const modelMatch = product.name.match(/[A-Z]{1,3}[-]?[A-Z0-9]{2,}[-]?[A-Z0-9]*/gi);
    if (modelMatch) {
      for (const m of modelMatch) {
        const cleanModel = m.replace(/-/g, '');
        if (specsMap[m]) {
          matchedSpecs = specsMap[m].specs;
          matchedModel = m;
          break;
        }
        if (specsMap[cleanModel]) {
          matchedSpecs = specsMap[cleanModel].specs;
          matchedModel = cleanModel;
          break;
        }
      }
    }
  }

  // 如果找到匹配的規格，更新商品資料
  if (matchedSpecs) {
    // 初始化 specs 物件
    if (!product.specs) {
      product.specs = {};
    }

    // 更新各項規格 (只更新原本沒有值的欄位)
    if (matchedSpecs.power_consumption && !product.power_consumption) {
      product.power_consumption = matchedSpecs.power_consumption;
    }
    if (matchedSpecs.tank_capacity && !product.tank_capacity) {
      product.tank_capacity = matchedSpecs.tank_capacity;
    }
    if (matchedSpecs.noise_level && !product.noise_level) {
      product.noise_level = matchedSpecs.noise_level;
    }
    if (matchedSpecs.energy_efficiency && !product.energy_efficiency) {
      product.energy_efficiency = matchedSpecs.energy_efficiency;
    }
    if (matchedSpecs.coverage_area && !product.coverage_area) {
      product.coverage_area = matchedSpecs.coverage_area;
    }
    if (matchedSpecs.weight) {
      product.specs.weight = matchedSpecs.weight;
    }
    if (matchedSpecs.dimensions) {
      product.specs.dimensions = matchedSpecs.dimensions;
    }
    if (matchedSpecs.energy_factor) {
      product.specs.energy_factor = matchedSpecs.energy_factor;
    }
    if (matchedSpecs.features && matchedSpecs.features.length > 0) {
      // 合併功能特色
      const existingFeatures = product.features || [];
      const newFeatures = matchedSpecs.features.filter(f => !existingFeatures.includes(f));
      product.features = [...existingFeatures, ...newFeatures];
    }

    updatedCount++;
    matchedModels[matchedModel] = (matchedModels[matchedModel] || 0) + 1;
  }
});

// 統計結果
console.log(`\n已更新商品數量: ${updatedCount}`);
console.log('\n型號匹配統計:');
Object.entries(matchedModels)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([model, count]) => {
    console.log(`  ${model}: ${count} 個商品`);
  });

// 儲存更新後的資料
fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));
console.log(`\n已儲存更新後的 products.json`);

// 顯示範例更新
console.log('\n=== 範例更新 ===');
const sampleProducts = productsData.products
  .filter(p => p.category_slug === 'dehumidifier' && p.power_consumption)
  .slice(0, 3);

sampleProducts.forEach(p => {
  console.log(`\n${p.brand} ${p.model} (${p.name.substring(0, 40)}...)`);
  console.log(`  功率: ${p.power_consumption}W`);
  console.log(`  水箱: ${p.tank_capacity}L`);
  console.log(`  噪音: ${p.noise_level || '-'}dB`);
  console.log(`  能效: ${p.energy_efficiency}級`);
  console.log(`  尺寸: ${p.specs?.dimensions || '-'}`);
  console.log(`  重量: ${p.specs?.weight || '-'}kg`);
  console.log(`  功能: ${(p.features || []).slice(0, 3).join(', ')}...`);
});
