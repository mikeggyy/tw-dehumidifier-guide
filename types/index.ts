// ============================================================
// 通用商品類型（多品類支援）
// ============================================================

// 品類定義
export interface Category {
  id: string;
  slug: string;           // 'dehumidifier', 'air-purifier'
  name: string;           // '除濕機', '空氣清淨機'
  icon: string;           // lucide icon name
  description?: string;
  is_active: boolean;
  sort_order: number;
}

// 通用商品介面
export interface Product {
  id: string;
  category_id?: string;   // FK to categories
  category_slug?: string; // 'dehumidifier', 'air-purifier'
  brand: string;
  model: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  affiliate_url: string;
  slug?: string;
  in_stock?: boolean;
  source?: string;        // 'momo', 'pchome'
  source_id?: string;
  specs: Record<string, any>;  // 彈性存放各品類規格
  features?: string[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// 除濕機（向後相容）
// ============================================================

export interface Dehumidifier {
  id: string;
  brand: string;          // e.g., "Panasonic", "Hitachi", "LG"
  model: string;          // e.g., "F-Y22EN"
  name: string;           // Display name e.g., "F-Y12PM 6L除濕機"
  price: number;          // TWD (促銷價)
  original_price?: number | null; // TWD (市售價/原價)
  daily_capacity: number | null; // Liters per day (e.g., 6, 10, 16)
  tank_capacity: number | null;  // Liters (e.g., 3.5, 5.0)
  noise_level: number | null;    // dB (Lower is better)
  power_consumption: number | null; // Watts (Lower is better)
  energy_efficiency: 1 | 2 | 3 | 4 | 5 | null; // Energy label (1 is best)
  features: string[];     // e.g., ["HEPA Filter", "App Control", "Shoe Drying"]
  image_url: string;      // Placeholder or real URL
  affiliate_url: string;  // The money-making link (MOMO/Shopee)
  slug?: string;          // URL slug for routing
  in_stock?: boolean;     // Stock status
  // 新增欄位（向後相容）
  category_slug?: string;
  specs?: Record<string, any>;
}

// 將 Dehumidifier 轉換為 Product
export function dehumidifierToProduct(d: Dehumidifier): Product {
  return {
    id: d.id,
    category_slug: 'dehumidifier',
    brand: d.brand,
    model: d.model,
    name: d.name,
    price: d.price,
    original_price: d.original_price,
    image_url: d.image_url,
    affiliate_url: d.affiliate_url,
    slug: d.slug,
    in_stock: d.in_stock,
    features: d.features,
    specs: {
      daily_capacity: d.daily_capacity,
      tank_capacity: d.tank_capacity,
      noise_level: d.noise_level,
      power_consumption: d.power_consumption,
      energy_efficiency: d.energy_efficiency,
    },
  }
}

// 將 Product 轉換為 Dehumidifier（向後相容）
export function productToDehumidifier(p: Product): Dehumidifier {
  return {
    id: p.id,
    brand: p.brand,
    model: p.model,
    name: p.name,
    price: p.price,
    original_price: p.original_price,
    image_url: p.image_url,
    affiliate_url: p.affiliate_url,
    slug: p.slug,
    in_stock: p.in_stock,
    features: p.features || [],
    daily_capacity: p.specs?.daily_capacity ?? null,
    tank_capacity: p.specs?.tank_capacity ?? null,
    noise_level: p.specs?.noise_level ?? null,
    power_consumption: p.specs?.power_consumption ?? null,
    energy_efficiency: p.specs?.energy_efficiency ?? null,
    category_slug: p.category_slug,
    specs: p.specs,
  }
}

// ============================================================
// 篩選與排序
// ============================================================

export type SortOption =
  | 'popularity'
  | 'price_asc'
  | 'price_desc'
  | 'noise_asc'
  | 'capacity_desc'
  | 'discount_desc'
  | 'value_asc'
  // 空氣清淨機
  | 'cadr_desc'
  // 冷氣
  | 'cspf_desc'
  // 通用
  | 'power_desc';

// 除濕機篩選（向後相容）
export interface FilterState {
  brands: string[];
  capacityRange: 'all' | 'under10' | '10to15' | 'over15';
  priceMin: number;
  priceMax: number;
}

// 通用篩選狀態
export interface GenericFilterState {
  brands: string[];
  priceMin: number;
  priceMax: number;
  // 動態篩選條件（根據品類不同）
  [key: string]: any;
}
