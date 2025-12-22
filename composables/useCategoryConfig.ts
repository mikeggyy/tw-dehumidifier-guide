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

export interface FAQItem {
  question: string
  answer: string
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
  faqs?: FAQItem[]          // 常見問題 (用於 SEO)
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
    {
      key: 'coverage_area',
      label: '適用坪數',
      unit: '坪',
      icon: 'Home',
      filterType: 'none',
      compareDirection: 'higher',
      showInCard: true,
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'weight',
      label: '重量',
      unit: 'kg',
      icon: 'Scale',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'dimensions',
      label: '尺寸',
      icon: 'Ruler',
      filterType: 'none',
      compareDirection: 'none',
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
  faqs: [
    {
      question: '除濕機一天要開多久？',
      answer: '一般建議室內濕度維持在 50-60% 最舒適。台灣梅雨季或潮濕天氣，除濕機可以連續運轉直到達到目標濕度後自動停機。多數除濕機有濕度感測功能，設定目標濕度後會自動控制，不需要一直開著。',
    },
    {
      question: '除濕機適用坪數怎麼算？',
      answer: '除濕機適用坪數 = 日除濕量(L) ÷ 每坪所需除濕量(約 0.66L)。例如 12L/日的除濕機約適用 18 坪空間。建議選擇比實際坪數大一些的機型，除濕效率更好。',
    },
    {
      question: '除濕機和冷氣除濕哪個省電？',
      answer: '除濕機比冷氣除濕省電約 3-5 倍。冷氣除濕時需同時運轉壓縮機降溫，而除濕機專門設計用於除濕，能效更高。如果只需除濕不需降溫，使用除濕機更經濟。',
    },
    {
      question: '一級能效和三級能效差多少電費？',
      answer: '以 12L/日除濕機為例，一級能效每年約省下 500-800 元電費。一級能效機型雖然價格較高，但長期使用下來更省錢，通常 2-3 年可回本。',
    },
    {
      question: '除濕機水滿不處理會怎樣？',
      answer: '除濕機水箱滿時會自動停機保護，不會溢出。但建議定期倒水，避免水箱滋生細菌。如果長時間不在家，可接上排水管連續排水，就不用擔心水滿問題。',
    },
  ],
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
    {
      key: 'energy_efficiency',
      label: '能效等級',
      icon: 'Leaf',
      filterType: 'none',
      formatValue: formatEnergyEfficiency,
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'weight',
      label: '重量',
      unit: 'kg',
      icon: 'Scale',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'dimensions',
      label: '尺寸',
      icon: 'Ruler',
      filterType: 'none',
      compareDirection: 'none',
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
  faqs: [
    {
      question: '空氣清淨機 CADR 值是什麼？怎麼選？',
      answer: 'CADR (Clean Air Delivery Rate) 是潔淨空氣輸出率，數值越高代表淨化速度越快。選購建議：CADR 值至少要是房間坪數的 10 倍。例如 10 坪房間需要 CADR 100 以上的機型。',
    },
    {
      question: '空氣清淨機一天要開多久？',
      answer: '建議空氣清淨機 24 小時運轉。現代空氣清淨機有自動模式，會根據空氣品質自動調整風速，待機時耗電很低。持續運轉才能維持室內空氣品質。',
    },
    {
      question: '空氣清淨機濾網多久換一次？',
      answer: 'HEPA 濾網建議 1-2 年更換一次，活性碳濾網約 6-12 個月。實際壽命取決於空氣品質和使用頻率。多數機型有濾網更換提醒功能，依提示更換即可。',
    },
    {
      question: 'HEPA 濾網等級差別在哪？',
      answer: 'HEPA 分為 H10-H14 等級，數字越高過濾效果越好。H13 可過濾 99.95% 的 0.3 微米微粒，H14 達 99.995%。一般家用 H13 等級已足夠，醫療級才需 H14。',
    },
    {
      question: '空氣清淨機可以過濾 PM2.5 嗎？',
      answer: '配備 HEPA 濾網的空氣清淨機可有效過濾 PM2.5。HEPA 濾網可捕捉 0.3 微米以上微粒，而 PM2.5 指的是 2.5 微米以下的懸浮微粒，因此 HEPA 濾網對 PM2.5 有很好的過濾效果。',
    },
  ],
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
    {
      key: 'weight',
      label: '重量',
      unit: 'kg',
      icon: 'Scale',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'dimensions',
      label: '尺寸',
      icon: 'Ruler',
      filterType: 'none',
      compareDirection: 'none',
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
  faqs: [
    {
      question: '冷氣噸數怎麼算？幾坪要用多大的冷氣？',
      answer: '一般計算公式：坪數 × 450 kcal/h = 所需冷氣能力。簡易對照：4-6 坪約需 1 噸 (2.8kW)，7-9 坪約需 1.5 噸 (3.6kW)，10-12 坪約需 2 噸 (5.0kW)。頂樓、西曬房間建議選大一級。',
    },
    {
      question: '變頻冷氣和定頻冷氣差多少電費？',
      answer: '變頻冷氣比定頻省電約 30-50%。以每天使用 8 小時計算，變頻冷氣每月可省約 300-500 元電費。雖然變頻機價格較高，但長期使用更划算，通常 2-3 年可回本。',
    },
    {
      question: '一級能效冷氣真的比較省電嗎？',
      answer: '是的，一級能效冷氣比五級能效省電約 30-40%。以 10 坪空間每天用 8 小時計算，一級能效每年可省約 2000-3000 元電費。購買時多花的錢，通常 3-4 年就能省回來。',
    },
    {
      question: '冷暖氣和單冷哪個比較好？',
      answer: '台灣北部冬天較冷，建議選冷暖兩用；中南部冬天較溫暖，單冷即可。冷暖氣價格較高約 2000-5000 元，但冬天暖房比電暖器更省電。如有預算考量，單冷搭配電暖器也是選項。',
    },
    {
      question: '冷氣安裝費用大概多少？',
      answer: '標準安裝費約 3000-5000 元，含基本配管 3-4 米。額外費用：配管超過長度約 800-1200 元/米、室外機吊掛約 1500-3000 元、舊機拆除約 500-1000 元。建議安裝前先請師傅到府估價。',
    },
  ],
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
      filterType: 'none',
      formatValue: formatEnergyEfficiency,
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'weight',
      label: '重量',
      unit: 'kg',
      icon: 'Scale',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'dimensions',
      label: '尺寸',
      icon: 'Ruler',
      filterType: 'none',
      compareDirection: 'none',
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
  faqs: [
    {
      question: '電暖器哪種類型最省電？',
      answer: '葉片式電暖器最省電但升溫慢，適合長時間使用；陶瓷式升溫快但較耗電，適合短時間取暖；鹵素燈/碳素燈效率最高但只能局部加熱。以每天用 8 小時計算，葉片式每月約 600-800 元，陶瓷式約 800-1200 元。',
    },
    {
      question: '電暖器適用坪數怎麼選？',
      answer: '一般計算：每坪約需 100-150W 功率。4-6 坪需 500-800W，6-8 坪需 800-1200W，8-10 坪需 1200-1500W。密閉空間可選小一點，開放空間建議選大一級。',
    },
    {
      question: '電暖器放哪裡最有效？',
      answer: '放在房間角落或窗邊，讓暖空氣自然循環。避免直接對著人吹，容易造成皮膚乾燥。葉片式可放中央位置，鹵素燈/碳素燈建議對著需要加熱的區域。',
    },
    {
      question: '電暖器和冷暖氣哪個省電？',
      answer: '冷暖氣比電暖器省電約 3-4 倍，因為冷暖氣使用熱泵原理。但電暖器不需安裝、可移動、價格便宜。如果只是偶爾使用幾天，電暖器較划算；長期使用建議用冷暖氣。',
    },
    {
      question: '電暖器使用要注意什麼安全事項？',
      answer: '避免覆蓋衣物或易燃物品、保持與周圍物品 50 公分以上距離、不使用延長線、睡覺時建議關閉或設定定時、選擇有傾倒斷電保護的機型。如有小孩或寵物，建議選葉片式較安全。',
    },
  ],
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
      key: 'weight',
      label: '重量',
      unit: 'kg',
      icon: 'Scale',
      filterType: 'none',
      compareDirection: 'lower',
      showInCompare: true,
      showInDetail: true,
    },
    {
      key: 'dimensions',
      label: '尺寸',
      icon: 'Ruler',
      filterType: 'none',
      compareDirection: 'none',
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
  faqs: [
    {
      question: 'DC 變頻扇和 AC 扇差多少電費？',
      answer: 'DC 變頻扇比 AC 扇省電約 50-70%。以每天用 8 小時計算，DC 扇每月約 15-30 元，AC 扇約 50-80 元。DC 扇價格較高，但風量調節更細膩、運轉更安靜。',
    },
    {
      question: '循環扇和一般電風扇差在哪？',
      answer: '循環扇風距遠、風壓強，適合讓空氣對流；一般電風扇風量大但風距短，適合直接吹人。循環扇搭配冷氣可加速冷房效果，讓溫度更均勻，建議選渦輪式設計。',
    },
    {
      question: '電風扇幾吋的比較涼？',
      answer: '14-16 吋適合 4-8 坪房間，12 吋以下適合 3 坪以下小空間。尺寸越大風量越強，但也越耗電。建議根據使用空間選擇，太大反而會太涼或太吵。',
    },
    {
      question: '大廈扇和立扇哪個比較好？',
      answer: '大廈扇外型細長不占空間、沒有扇葉較安全，適合有小孩的家庭；立扇風量大、價格便宜、維修容易。大廈扇風量通常較小，適合近距離使用。',
    },
    {
      question: '電風扇怎麼吹比較涼？',
      answer: '電風扇對著窗外吹可排出熱空氣、朝天花板吹可促進空氣循環、搭配冷氣時對著冷氣出風口吹可加速冷房。晚上可加盆冰水放風扇前，有類似冷氣的效果。',
    },
  ],
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
