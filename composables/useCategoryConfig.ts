// 品類設定系統 - 定義各品類的規格、篩選器、排序等

export interface SpecConfig {
  key: string
  label: string
  unit?: string
  icon?: string
  filterType: 'range' | 'select' | 'checkbox' | 'none'
  options?: { value: string; label: string }[]
  formatValue?: (value: any) => string
  compareDirection?: 'higher' | 'lower' | 'none'  // 比較時哪個方向較好
  showInCard?: boolean      // 是否顯示在卡片上
  showInCompare?: boolean   // 是否顯示在比較表
  showInDetail?: boolean    // 是否顯示在詳情頁
}

export interface QuickTag {
  label: string
  filterKey?: string
  filterValue?: any
  sortBy?: string
}

export interface CategoryConfig {
  slug: string
  name: string
  namePlural: string        // 複數名稱，用於 "XX 款除濕機"
  icon: string              // lucide icon name
  description: string
  seoTitle: string
  seoDescription: string
  specs: SpecConfig[]
  quickTags: QuickTag[]
  defaultSort: string
  sortOptions: { value: string; label: string }[]
  popularBrands: string[]   // 用於熱門度計算
  cpValueSpec?: string      // 用於計算 CP 值的規格 key
}

// 能效等級格式化
const formatEnergyEfficiency = (value: number | null): string => {
  if (!value) return '-'
  const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
  return labels[value] || '-'
}

// 除濕機設定
const dehumidifierConfig: CategoryConfig = {
  slug: 'dehumidifier',
  name: '除濕機',
  namePlural: '款除濕機',
  icon: 'Droplets',
  description: '比較各品牌除濕機規格、價格，找到最適合你的選擇',
  seoTitle: '除濕機比較推薦 2025 - 規格、價格一次看',
  seoDescription: '2025 最完整的除濕機規格比較網站，收錄 Panasonic、Hitachi、LG 等品牌，提供日除濕量、噪音、能效比較。',
  specs: [
    {
      key: 'daily_capacity',
      label: '日除濕量',
      unit: 'L',
      icon: 'Droplets',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部容量' },
        { value: 'under10', label: '10L 以下' },
        { value: '10to15', label: '10-15L' },
        { value: 'over15', label: '15L 以上' },
      ],
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'tank_capacity',
      label: '水箱容量',
      unit: 'L',
      icon: 'Box',
      filterType: 'none',
      compareDirection: 'higher',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'noise_level',
      label: '噪音值',
      unit: 'dB',
      icon: 'Volume2',
      filterType: 'none',
      compareDirection: 'lower',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'power_consumption',
      label: '消耗功率',
      unit: 'W',
      icon: 'Zap',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'energy_efficiency',
      label: '能效等級',
      icon: 'Leaf',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部能效' },
        { value: '1', label: '一級能效' },
        { value: '2', label: '二級能效' },
        { value: '3', label: '三級能效' },
      ],
      formatValue: formatEnergyEfficiency,
      compareDirection: 'lower',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
  ],
  quickTags: [
    { label: '小坪數首選', filterKey: 'capacityRange', filterValue: 'under10' },
    { label: '高CP值', sortBy: 'value_asc' },
    { label: '大容量', filterKey: 'capacityRange', filterValue: 'over15' },
    { label: '超值折扣', sortBy: 'discount_desc' },
    { label: '靜音款', sortBy: 'noise_asc' },
  ],
  defaultSort: 'popularity',
  sortOptions: [
    { value: 'popularity', label: '熱門推薦' },
    { value: 'discount_desc', label: '折扣幅度' },
    { value: 'value_asc', label: 'CP值最高' },
    { value: 'price_asc', label: '價格：低到高' },
    { value: 'price_desc', label: '價格：高到低' },
    { value: 'capacity_desc', label: '除濕力：強到弱' },
    { value: 'noise_asc', label: '最安靜' },
  ],
  popularBrands: ['Panasonic', '國際牌', 'HITACHI', '日立', 'SHARP', '夏普', 'MITSUBISHI', '三菱', 'LG'],
  cpValueSpec: 'daily_capacity',
}

// 空氣清淨機設定
const airPurifierConfig: CategoryConfig = {
  slug: 'air-purifier',
  name: '空氣清淨機',
  namePlural: '款空氣清淨機',
  icon: 'Wind',
  description: '比較各品牌空氣清淨機規格、CADR值、價格',
  seoTitle: '空氣清淨機比較推薦 2025 - CADR、坪數、濾網一次看',
  seoDescription: '2025 最完整的空氣清淨機規格比較，收錄各大品牌，提供 CADR、適用坪數、濾網成本比較。',
  specs: [
    {
      key: 'cadr',
      label: 'CADR 值',
      unit: 'm³/h',
      icon: 'Wind',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部 CADR' },
        { value: 'under200', label: '200 以下（小坪數）' },
        { value: '200to400', label: '200-400（中坪數）' },
        { value: 'over400', label: '400 以上（大坪數）' },
      ],
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'coverage',
      label: '適用坪數',
      unit: '坪',
      icon: 'Home',
      filterType: 'range',
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'filter_type',
      label: '濾網類型',
      icon: 'Filter',
      filterType: 'checkbox',
      options: [
        { value: 'hepa', label: 'HEPA' },
        { value: 'hepa13', label: 'HEPA 13' },
        { value: 'carbon', label: '活性碳' },
        { value: 'photocatalyst', label: '光觸媒' },
      ],
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'filter_life',
      label: '濾網壽命',
      unit: '個月',
      icon: 'Clock',
      filterType: 'none',
      compareDirection: 'higher',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'filter_cost',
      label: '濾網成本',
      unit: '元/年',
      icon: 'DollarSign',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'noise_level',
      label: '噪音值',
      unit: 'dB',
      icon: 'Volume2',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'power_consumption',
      label: '消耗功率',
      unit: 'W',
      icon: 'Zap',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'pm25_sensor',
      label: 'PM2.5 感測器',
      icon: 'Gauge',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'app_control',
      label: 'APP 控制',
      icon: 'Smartphone',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
  ],
  quickTags: [
    { label: '小坪數', filterKey: 'cadrRange', filterValue: 'under200' },
    { label: '高CADR', filterKey: 'cadrRange', filterValue: 'over400' },
    { label: '高CP值', sortBy: 'value_asc' },
    { label: '靜音款', sortBy: 'noise_asc' },
    { label: '超值折扣', sortBy: 'discount_desc' },
  ],
  defaultSort: 'popularity',
  sortOptions: [
    { value: 'popularity', label: '熱門推薦' },
    { value: 'discount_desc', label: '折扣幅度' },
    { value: 'value_asc', label: 'CP值最高' },
    { value: 'price_asc', label: '價格：低到高' },
    { value: 'price_desc', label: '價格：高到低' },
    { value: 'cadr_desc', label: 'CADR：高到低' },
    { value: 'noise_asc', label: '最安靜' },
  ],
  popularBrands: ['Dyson', 'Panasonic', 'SHARP', 'Honeywell', 'Philips', 'LG', 'Coway', '3M'],
  cpValueSpec: 'cadr',
}

// 冷氣設定
const airConditionerConfig: CategoryConfig = {
  slug: 'air-conditioner',
  name: '冷氣',
  namePlural: '款冷氣',
  icon: 'Snowflake',
  description: '比較各品牌冷氣規格、能效、價格',
  seoTitle: '冷氣比較推薦 2025 - 能效、坪數、價格一次看',
  seoDescription: '2025 最完整的冷氣規格比較，收錄變頻、分離式、窗型冷氣，提供能效、適用坪數、噪音比較。',
  specs: [
    {
      key: 'cooling_capacity',
      label: '冷氣能力',
      unit: 'kW',
      icon: 'Snowflake',
      filterType: 'range',
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'coverage',
      label: '適用坪數',
      unit: '坪',
      icon: 'Home',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部坪數' },
        { value: 'under5', label: '5坪以下' },
        { value: '5to8', label: '5-8坪' },
        { value: '8to12', label: '8-12坪' },
        { value: 'over12', label: '12坪以上' },
      ],
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'type',
      label: '類型',
      icon: 'LayoutGrid',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部類型' },
        { value: 'split', label: '分離式' },
        { value: 'window', label: '窗型' },
        { value: 'portable', label: '移動式' },
      ],
      formatValue: (v: string) => {
        const map: Record<string, string> = {
          'split': '分離式',
          'window': '窗型',
          'portable': '移動式',
        }
        return map[v] || v
      },
      compareDirection: 'none',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'inverter',
      label: '變頻/定頻',
      icon: 'Zap',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部' },
        { value: 'inverter', label: '變頻' },
        { value: 'fixed', label: '定頻' },
      ],
      formatValue: (v: string | boolean) => {
        if (typeof v === 'boolean') return v ? '變頻' : '定頻'
        const map: Record<string, string> = {
          'inverter': '變頻',
          'fixed': '定頻',
          'true': '變頻',
          'false': '定頻',
        }
        return map[v] || v
      },
      compareDirection: 'none',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'cspf',
      label: 'CSPF 能效',
      icon: 'Leaf',
      filterType: 'none',
      compareDirection: 'higher',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'energy_efficiency',
      label: '能效等級',
      icon: 'Award',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部能效' },
        { value: '1', label: '一級能效' },
        { value: '2', label: '二級能效' },
      ],
      formatValue: formatEnergyEfficiency,
      compareDirection: 'lower',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'noise_indoor',
      label: '室內機噪音',
      unit: 'dB',
      icon: 'Volume2',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'noise_outdoor',
      label: '室外機噪音',
      unit: 'dB',
      icon: 'Volume1',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'heating',
      label: '冷暖兩用',
      icon: 'Flame',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '冷暖' : '單冷',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
  ],
  quickTags: [
    { label: '小套房', filterKey: 'coverageRange', filterValue: 'under5' },
    { label: '客廳首選', filterKey: 'coverageRange', filterValue: '8to12' },
    { label: '一級能效', filterKey: 'energy_efficiency', filterValue: '1' },
    { label: '變頻省電', filterKey: 'inverter', filterValue: 'inverter' },
    { label: '超值折扣', sortBy: 'discount_desc' },
  ],
  defaultSort: 'popularity',
  sortOptions: [
    { value: 'popularity', label: '熱門推薦' },
    { value: 'discount_desc', label: '折扣幅度' },
    { value: 'value_asc', label: 'CP值最高' },
    { value: 'price_asc', label: '價格：低到高' },
    { value: 'price_desc', label: '價格：高到低' },
    { value: 'capacity_desc', label: '冷氣能力：強到弱' },
    { value: 'cspf_desc', label: '能效：高到低' },
  ],
  popularBrands: ['Panasonic', '國際牌', 'DAIKIN', '大金', 'HITACHI', '日立', 'Mitsubishi', '三菱', 'LG'],
  cpValueSpec: 'cooling_capacity',
}

// 電暖器設定
const heaterConfig: CategoryConfig = {
  slug: 'heater',
  name: '電暖器',
  namePlural: '款電暖器',
  icon: 'Flame',
  description: '比較各品牌電暖器規格、功率、價格',
  seoTitle: '電暖器比較推薦 2025 - 功率、類型、價格一次看',
  seoDescription: '2025 最完整的電暖器規格比較，收錄葉片式、陶瓷式、鹵素電暖器，提供功率、適用坪數比較。',
  specs: [
    {
      key: 'heating_power',
      label: '加熱功率',
      unit: 'W',
      icon: 'Flame',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部功率' },
        { value: 'under500', label: '500W 以下' },
        { value: '500to1000', label: '500-1000W' },
        { value: 'over1000', label: '1000W 以上' },
      ],
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'type',
      label: '類型',
      icon: 'LayoutGrid',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部類型' },
        { value: 'ceramic', label: '陶瓷式' },
        { value: 'oil', label: '葉片式' },
        { value: 'halogen', label: '鹵素/碳素' },
        { value: 'fan', label: '暖風機' },
      ],
      formatValue: (v: string) => {
        const map: Record<string, string> = {
          'ceramic': '陶瓷式',
          'oil': '葉片式',
          'halogen': '鹵素/碳素',
          'carbon': '碳素式',
          'fan': '暖風機',
          'ptc': 'PTC陶瓷式',
          'infrared': '紅外線',
          'convection': '對流式',
        }
        return map[v] || v
      },
      compareDirection: 'none',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'coverage',
      label: '適用坪數',
      unit: '坪',
      icon: 'Home',
      filterType: 'range',
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'oscillation',
      label: '擺頭功能',
      icon: 'RotateCw',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'timer',
      label: '定時功能',
      icon: 'Clock',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'tip_over_protection',
      label: '傾倒斷電',
      icon: 'ShieldCheck',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
  ],
  quickTags: [
    { label: '小坪數', filterKey: 'powerRange', filterValue: 'under500' },
    { label: '大功率', filterKey: 'powerRange', filterValue: 'over1000' },
    { label: '葉片式', filterKey: 'type', filterValue: 'oil' },
    { label: '高CP值', sortBy: 'value_asc' },
    { label: '超值折扣', sortBy: 'discount_desc' },
  ],
  defaultSort: 'popularity',
  sortOptions: [
    { value: 'popularity', label: '熱門推薦' },
    { value: 'discount_desc', label: '折扣幅度' },
    { value: 'value_asc', label: 'CP值最高' },
    { value: 'price_asc', label: '價格：低到高' },
    { value: 'price_desc', label: '價格：高到低' },
    { value: 'power_desc', label: '功率：高到低' },
  ],
  popularBrands: ['Panasonic', 'NORTHERN', '北方', 'SAMPO', '聲寶', 'HERAN', '禾聯', 'AIRMATE', '艾美特'],
  cpValueSpec: 'heating_power',
}

// 電風扇/循環扇設定
const fanConfig: CategoryConfig = {
  slug: 'fan',
  name: '電風扇',
  namePlural: '款電風扇',
  icon: 'Fan',
  description: '比較各品牌電風扇、循環扇規格、價格',
  seoTitle: '電風扇比較推薦 2025 - DC扇、循環扇價格一次看',
  seoDescription: '2025 最完整的電風扇規格比較，收錄 DC 變頻扇、循環扇、大廈扇，提供風量、噪音比較。',
  specs: [
    {
      key: 'fan_type',  // 對應資料庫 specs.fan_type
      label: '類型',
      icon: 'LayoutGrid',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部類型' },
        { value: 'stand', label: '立扇' },
        { value: 'circulator', label: '循環扇' },
        { value: 'tower', label: '大廈扇' },
        { value: 'desk', label: '桌扇' },
      ],
      formatValue: (v: string) => {
        const map: Record<string, string> = {
          'stand': '立扇',
          'circulator': '循環扇',
          'tower': '大廈扇',
          'desk': '桌扇',
        }
        return map[v] || v
      },
      compareDirection: 'none',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'motor_type',  // 對應資料庫 specs.motor_type
      label: '馬達類型',
      icon: 'Cpu',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部' },
        { value: 'dc', label: 'DC 變頻' },
        { value: 'ac', label: 'AC 定頻' },
      ],
      formatValue: (v: string) => v === 'dc' ? 'DC 變頻' : 'AC 定頻',
      compareDirection: 'none',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'size',  // 對應資料庫 specs.size (原本是 blade_size)
      label: '扇葉尺寸',
      unit: '吋',
      icon: 'Circle',
      filterType: 'select',
      options: [
        { value: 'all', label: '全部尺寸' },
        { value: 'under12', label: '12吋以下' },
        { value: '14', label: '14吋' },
        { value: '16', label: '16吋' },
        { value: 'over16', label: '16吋以上' },
      ],
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'noise_level',  // 對應資料庫 specs.noise_level
      label: '噪音值',
      unit: 'dB',
      icon: 'Volume2',
      filterType: 'none',
      compareDirection: 'lower',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'has_remote',  // 從 features 提取
      label: '遙控器',
      icon: 'Radio',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'has_timer',  // 從 features 提取
      label: '定時功能',
      icon: 'Clock',
      filterType: 'checkbox',
      formatValue: (v: boolean) => v ? '有' : '無',
      compareDirection: 'none',
      showInCompare: true,
      showInDetail: true,
    },
  ],
  quickTags: [
    { label: 'DC變頻', filterKey: 'motor_type', filterValue: 'dc' },
    { label: '循環扇', filterKey: 'fan_type', filterValue: 'circulator' },
    { label: '大廈扇', filterKey: 'fan_type', filterValue: 'tower' },
    { label: '高CP值', sortBy: 'value_asc' },
    { label: '超值折扣', sortBy: 'discount_desc' },
  ],
  defaultSort: 'popularity',
  sortOptions: [
    { value: 'popularity', label: '熱門推薦' },
    { value: 'discount_desc', label: '折扣幅度' },
    { value: 'value_asc', label: 'CP值最高' },
    { value: 'price_asc', label: '價格：低到高' },
    { value: 'price_desc', label: '價格：高到低' },
    { value: 'noise_asc', label: '最安靜' },
  ],
  popularBrands: ['Panasonic', 'SAMPO', '聲寶', 'HERAN', '禾聯', 'AIRMATE', '艾美特', 'CHIMEI', '奇美', 'TECO', '東元', 'IRIS'],
  cpValueSpec: 'size',  // 改為 size
}

// 所有品類設定
export const categoryConfigs: Record<string, CategoryConfig> = {
  dehumidifier: dehumidifierConfig,
  'air-purifier': airPurifierConfig,
  'air-conditioner': airConditionerConfig,
  heater: heaterConfig,
  fan: fanConfig,
}

// 品類列表（用於首頁顯示）
export const categoryList = [
  { slug: 'dehumidifier', name: '除濕機', icon: 'Droplets', available: true },
  { slug: 'air-purifier', name: '空氣清淨機', icon: 'Wind', available: true },
  { slug: 'air-conditioner', name: '冷氣', icon: 'Snowflake', available: true },
  { slug: 'heater', name: '電暖器', icon: 'Flame', available: true },
  { slug: 'fan', name: '電風扇', icon: 'Fan', available: true },
]

// Composable
export function useCategoryConfig() {
  const getCategoryConfig = (slug: string): CategoryConfig | undefined => {
    return categoryConfigs[slug]
  }

  const getAllCategories = () => {
    return categoryList
  }

  const getAvailableCategories = () => {
    return categoryList.filter(c => c.available)
  }

  const getSpecConfig = (categorySlug: string, specKey: string): SpecConfig | undefined => {
    const config = categoryConfigs[categorySlug]
    if (!config) return undefined
    return config.specs.find(s => s.key === specKey)
  }

  const formatSpecValue = (categorySlug: string, specKey: string, value: any): string => {
    const specConfig = getSpecConfig(categorySlug, specKey)
    if (!specConfig) return String(value ?? '-')

    if (value === null || value === undefined) return '-'

    if (specConfig.formatValue) {
      return specConfig.formatValue(value)
    }

    if (specConfig.unit) {
      return `${value} ${specConfig.unit}`
    }

    if (typeof value === 'boolean') {
      return value ? '有' : '無'
    }

    return String(value)
  }

  return {
    getCategoryConfig,
    getAllCategories,
    getAvailableCategories,
    getSpecConfig,
    formatSpecValue,
    categoryConfigs,
    categoryList,
  }
}
