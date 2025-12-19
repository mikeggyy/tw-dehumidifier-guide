-- ============================================================
-- 多品類支援資料庫遷移
-- 執行方式：在 Supabase SQL Editor 中執行此檔案
-- ============================================================

-- 1. 建立品類表
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  seo_title VARCHAR(200),
  seo_description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 插入預設品類
INSERT INTO categories (slug, name, icon, description, is_active, sort_order) VALUES
  ('dehumidifier', '除濕機', 'Droplets', '比較各品牌除濕機規格、價格，找到最適合你的選擇', true, 1),
  ('air-purifier', '空氣清淨機', 'Wind', '比較各品牌空氣清淨機規格、CADR值、價格', false, 2),
  ('air-conditioner', '冷氣', 'Snowflake', '比較各品牌冷氣規格、能效、價格', false, 3),
  ('heater', '電暖器', 'Flame', '比較各品牌電暖器規格、功率、價格', false, 4),
  ('fan', '電風扇', 'Fan', '比較各品牌電風扇、循環扇規格、價格', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- 3. 修改 products 表，加入 category 和 specs 欄位
-- 注意：如果欄位已存在會報錯，可以忽略

-- 加入 category_id 欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);
  END IF;
END $$;

-- 加入 category_slug 欄位（方便查詢）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_slug'
  ) THEN
    ALTER TABLE products ADD COLUMN category_slug VARCHAR(50) DEFAULT 'dehumidifier';
  END IF;
END $$;

-- 加入 specs JSONB 欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'specs'
  ) THEN
    ALTER TABLE products ADD COLUMN specs JSONB DEFAULT '{}';
  END IF;
END $$;

-- 加入 source 欄位（momo, pchome 等）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'source'
  ) THEN
    ALTER TABLE products ADD COLUMN source VARCHAR(50) DEFAULT 'momo';
  END IF;
END $$;

-- 加入 source_id 欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE products ADD COLUMN source_id VARCHAR(100);
  END IF;
END $$;

-- 4. 將現有除濕機資料的規格遷移到 specs JSONB
UPDATE products
SET
  category_slug = 'dehumidifier',
  specs = jsonb_build_object(
    'daily_capacity', daily_capacity,
    'tank_capacity', tank_capacity,
    'noise_level', noise_level,
    'power_consumption', power_consumption,
    'energy_efficiency', energy_efficiency
  )
WHERE category_slug IS NULL OR specs = '{}' OR specs IS NULL;

-- 5. 設定 category_id（從 categories 表取得）
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category_slug = c.slug AND p.category_id IS NULL;

-- 6. 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_specs ON products USING GIN(specs);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- 7. 更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 products 表加入觸發器
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 為 categories 表加入觸發器
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 啟用 RLS（Row Level Security）- 如果尚未啟用
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 9. 建立 RLS 政策（允許所有人讀取）
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

-- ============================================================
-- 完成！
-- 驗證方式：執行以下查詢確認資料正確
-- ============================================================

-- 查看品類
-- SELECT * FROM categories ORDER BY sort_order;

-- 查看商品（含 specs）
-- SELECT id, name, category_slug, specs FROM products LIMIT 5;

-- 查看特定品類商品數量
-- SELECT category_slug, COUNT(*) FROM products GROUP BY category_slug;
