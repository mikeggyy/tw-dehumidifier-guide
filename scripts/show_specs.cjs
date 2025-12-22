const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf8'));

// 找幾個有完整規格的商品範例
const samples = data.products
  .filter(p => p.category_slug === 'dehumidifier' && p.specs && p.specs.weight)
  .slice(0, 5);

console.log('=== 新增規格資料範例 ===\n');

samples.forEach((p, i) => {
  console.log(`【${i+1}】${p.brand} ${p.model}`);
  console.log(`   商品名: ${p.name.substring(0, 50)}...`);
  console.log('');
  console.log('   ▼ 原本就有的資料:');
  console.log(`   - 價格: $${p.price}`);
  console.log(`   - 每日除濕量: ${p.daily_capacity}L`);
  console.log('');
  console.log('   ▼ 新增的規格資料:');
  console.log(`   - 功率: ${p.power_consumption || '無'}W`);
  console.log(`   - 水箱容量: ${p.tank_capacity || '無'}L`);
  console.log(`   - 噪音值: ${p.noise_level || '無'}dB`);
  console.log(`   - 能效等級: ${p.energy_efficiency || '無'}級`);
  console.log(`   - 適用坪數: ${p.coverage_area || '無'}`);
  console.log(`   - 尺寸: ${p.specs.dimensions || '無'} mm`);
  console.log(`   - 重量: ${p.specs.weight || '無'} kg`);
  console.log(`   - 能源因數: ${p.specs.energy_factor || '無'} L/kWh`);
  console.log('');
  console.log('   ▼ 新增的功能特色:');
  const features = p.features || [];
  features.slice(0, 6).forEach(f => console.log(`   - ${f}`));
  if (features.length > 6) console.log(`   ... 還有 ${features.length - 6} 項`);
  console.log('\n' + '─'.repeat(60) + '\n');
});

// 統計
console.log('\n=== 統計 ===');
const dehumidifiers = data.products.filter(p => p.category_slug === 'dehumidifier');
const withPower = dehumidifiers.filter(p => p.power_consumption).length;
const withTank = dehumidifiers.filter(p => p.tank_capacity).length;
const withNoise = dehumidifiers.filter(p => p.noise_level).length;
const withDimensions = dehumidifiers.filter(p => p.specs && p.specs.dimensions).length;
const withWeight = dehumidifiers.filter(p => p.specs && p.specs.weight).length;
const withFeatures = dehumidifiers.filter(p => p.features && p.features.length > 1).length;

console.log(`總商品數: ${dehumidifiers.length}`);
console.log(`有功率資料: ${withPower} (${Math.round(withPower/dehumidifiers.length*100)}%)`);
console.log(`有水箱容量: ${withTank} (${Math.round(withTank/dehumidifiers.length*100)}%)`);
console.log(`有噪音值: ${withNoise} (${Math.round(withNoise/dehumidifiers.length*100)}%)`);
console.log(`有尺寸: ${withDimensions} (${Math.round(withDimensions/dehumidifiers.length*100)}%)`);
console.log(`有重量: ${withWeight} (${Math.round(withWeight/dehumidifiers.length*100)}%)`);
console.log(`有功能特色: ${withFeatures} (${Math.round(withFeatures/dehumidifiers.length*100)}%)`);
