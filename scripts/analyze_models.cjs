const fs = require('fs');
const products = JSON.parse(fs.readFileSync('major_brands_products.json', 'utf8'));

// 提取唯一型號 (用 brand + model 組合)
const uniqueModels = new Map();
products.forEach(p => {
  // 清理型號名稱
  let model = p.model;
  if (model === p.brand || model === '' || model === null) {
    // 從名稱中提取型號
    const match = p.name.match(/[A-Z]{1,3}[-]?[A-Z0-9]{3,15}/i);
    if (match) model = match[0];
  }

  const key = p.brand + '|' + model;
  if (!uniqueModels.has(key)) {
    uniqueModels.set(key, {
      brand: p.brand,
      model: model,
      name: p.name,
      daily_capacity: p.daily_capacity,
      ids: [p.id]
    });
  } else {
    uniqueModels.get(key).ids.push(p.id);
  }
});

console.log('唯一型號數量: ' + uniqueModels.size);
console.log('');

// 輸出唯一型號列表
const modelList = Array.from(uniqueModels.values());
fs.writeFileSync('unique_models.json', JSON.stringify(modelList, null, 2));
console.log('已儲存到 unique_models.json');

// 顯示統計
const brandStats = {};
modelList.forEach(m => {
  brandStats[m.brand] = (brandStats[m.brand] || 0) + 1;
});

console.log('');
console.log('各品牌唯一型號數:');
Object.entries(brandStats).sort((a,b) => b[1] - a[1]).forEach(([brand, count]) => {
  console.log('  ' + brand + ': ' + count);
});
