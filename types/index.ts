export interface Dehumidifier {
  id: string;
  brand: string;          // e.g., "Panasonic", "Hitachi", "LG"
  model: string;          // e.g., "F-Y22EN"
  name: string;           // Display name e.g., "F-Y12PM 6L除濕機"
  price: number;          // TWD
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
}

export type SortOption = 'popularity' | 'price_asc' | 'price_desc' | 'noise_asc' | 'capacity_desc';

export interface FilterState {
  brands: string[];
  capacityRange: 'all' | 'under10' | '10to15' | 'over15';
  priceMin: number;
  priceMax: number;
}
