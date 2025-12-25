export interface FAQItem {
  question: string
  answer: string
  category: 'dehumidifier' | 'air-purifier' | 'air-conditioner' | 'heater' | 'fan' | 'general'
}

export interface FAQCategory {
  slug: string
  name: string
  icon: string
}

export const faqCategories: FAQCategory[] = [
  { slug: 'general', name: '一般問題', icon: 'HelpCircle' },
  { slug: 'dehumidifier', name: '除濕機', icon: 'Droplets' },
  { slug: 'air-purifier', name: '空氣清淨機', icon: 'Wind' },
  { slug: 'air-conditioner', name: '冷氣', icon: 'Snowflake' },
  { slug: 'heater', name: '電暖器', icon: 'Flame' },
  { slug: 'fan', name: '電風扇', icon: 'Fan' },
]

export const faqs: FAQItem[] = [
  // 一般問題
  {
    question: '比比看網站的資料來源是什麼？',
    answer: '我們的商品資料來自 MOMO 購物網，每天自動更新價格和庫存狀態。規格資料由我們團隊整理自官方網站和產品說明書。',
    category: 'general'
  },
  {
    question: '商品價格多久更新一次？',
    answer: '我們的系統每天早上自動同步 MOMO 購物網的最新價格，確保您看到的是最新售價。不過實際購買價格請以購物網站為準。',
    category: 'general'
  },
  {
    question: '點選購買按鈕會連到哪裡？',
    answer: '點選「前往購買」按鈕會連結到 MOMO 購物網的商品頁面。我們是 MOMO 的合作夥伴，透過我們的連結購買，價格與直接在 MOMO 購買相同，但可以幫助我們維持網站營運。',
    category: 'general'
  },
  {
    question: '如何使用比較功能？',
    answer: '在商品卡片上點選「加入比較」按鈕，最多可選擇 4 款商品進行規格比較。比較頁面會並排顯示各項規格，讓您一目瞭然各款差異。',
    category: 'general'
  },

  // 除濕機
  {
    question: '除濕機日除濕量怎麼選？',
    answer: '一般建議每坪需要約 1 公升的日除濕量。例如 10 坪空間建議選擇 10L 以上的機種。如果住在潮濕地區（如北部、東部）或是低樓層，建議選大一號。',
    category: 'dehumidifier'
  },
  {
    question: '除濕機能效等級差多少電費？',
    answer: '一級能效比五級能效每月可省約 150-200 元電費。以每天使用 8 小時計算，一年可省下 1,800-2,400 元。雖然一級能效機種價格較高，但長期使用更划算。',
    category: 'dehumidifier'
  },
  {
    question: '除濕機放臥室會太吵嗎？',
    answer: '建議選擇噪音值 40dB 以下的機種。40dB 約等於圖書館的音量，不會影響睡眠。許多機種有「靜音模式」或「睡眠模式」，噪音可降到 35dB 以下。',
    category: 'dehumidifier'
  },
  {
    question: '壓縮機式和除濕輪式差在哪？',
    answer: '壓縮機式除濕效率高、較省電，適合台灣夏天；除濕輪式在低溫環境效果好、較安靜，適合冬天或衣物乾燥。台灣家庭一般選壓縮機式即可。',
    category: 'dehumidifier'
  },
  {
    question: '除濕機需要清潔保養嗎？',
    answer: '建議每 2 週清洗濾網一次，每月清潔水箱避免發霉。定期保養可延長使用壽命，也能維持除濕效率。',
    category: 'dehumidifier'
  },

  // 空氣清淨機
  {
    question: 'CADR 值是什麼意思？',
    answer: 'CADR（Clean Air Delivery Rate）是潔淨空氣輸出率，代表每分鐘能輸出多少立方公尺的乾淨空氣。數值越高，淨化效果越好。適用坪數約為 CADR × 0.07。',
    category: 'air-purifier'
  },
  {
    question: 'HEPA 濾網等級怎麼選？',
    answer: '建議選擇 H13 等級以上的 True HEPA 濾網，可過濾 99.95% 的 0.3 微米微粒。H11、H12 等級效果較差，市面上的「類 HEPA」效果更有限。',
    category: 'air-purifier'
  },
  {
    question: '空氣清淨機濾網多久換一次？',
    answer: '一般建議 6 個月到 2 年更換一次，視使用頻率和空氣品質而定。大多數機種有濾網更換提醒功能。購買前建議確認濾網價格，這是長期使用的主要成本。',
    category: 'air-purifier'
  },
  {
    question: '空氣清淨機可以 24 小時開嗎？',
    answer: '可以，而且建議 24 小時低速運轉。空氣清淨機耗電量很低（約 3-10W），24 小時運轉一個月電費不到 10 元。持續運轉才能維持室內空氣品質。',
    category: 'air-purifier'
  },
  {
    question: '有寵物該選什麼空氣清淨機？',
    answer: '建議選擇有活性碳濾網的機種，可有效去除寵物異味。CADR 值選大一點（建議 300 以上），因為寵物毛髮會增加濾網負擔。部分品牌有寵物專用濾網可選購。',
    category: 'air-purifier'
  },

  // 冷氣
  {
    question: '冷氣噸數怎麼算？',
    answer: '一般計算方式：每坪需要約 0.15 噸（450W）冷房能力。10 坪房間約需 1.5 噸。如果是頂樓、西曬或挑高空間，建議選大一級。',
    category: 'air-conditioner'
  },
  {
    question: '變頻冷氣比定頻省多少電？',
    answer: '變頻冷氣比定頻省約 30-50% 電費。以 10 坪房間、每天使用 8 小時計算，變頻一年約省 1,500-2,000 元。使用時間越長，省電效果越明顯。',
    category: 'air-conditioner'
  },
  {
    question: 'CSPF 能效值多少才算省電？',
    answer: 'CSPF 值越高越省電。一級能效 CSPF 約 6.0 以上，三級能效約 4.4-5.0。建議至少選二級能效以上的機種。',
    category: 'air-conditioner'
  },
  {
    question: '冷氣安裝費用大概多少？',
    answer: '標準安裝通常免費或 0-3,000 元。額外費用包括：銅管加長（每米 800-1,200 元）、高空作業費（1,500-3,000 元）、舊機拆除（500-1,500 元）。購買前務必確認安裝費用。',
    category: 'air-conditioner'
  },
  {
    question: '冷暖氣機值得買嗎？',
    answer: '台灣北部冬天濕冷，冷暖氣機很實用。冷暖機價格約多 2,000-5,000 元，但暖氣效率比電暖器高，長期使用更省電。中南部可視需求決定。',
    category: 'air-conditioner'
  },

  // 電暖器
  {
    question: '電暖器類型怎麼選？',
    answer: '葉片式：安靜不乾燥，適合臥室長時間使用；陶瓷式：升溫快，適合小空間快速取暖；鹵素燈：最快速，但只能局部取暖。有小孩的家庭建議選葉片式，外殼不燙手較安全。',
    category: 'heater'
  },
  {
    question: '電暖器瓦數怎麼選？',
    answer: '一般每坪需要約 100-150W。3-5 坪空間建議 600-1000W，5-8 坪建議 1000-1500W，8 坪以上建議 1500W 以上。',
    category: 'heater'
  },
  {
    question: '電暖器一個月電費多少？',
    answer: '以 1000W 電暖器、每天使用 6 小時計算，一個月電費約 600-700 元。建議選有定時功能和溫控的機種，可有效控制電費。',
    category: 'heater'
  },
  {
    question: '電暖器可以整晚開著睡嗎？',
    answer: '不建議。長時間使用可能導致室內過度乾燥，也有安全疑慮。建議使用定時功能設定 2-3 小時自動關機，或選擇有恆溫控制的機種。',
    category: 'heater'
  },
  {
    question: '電暖器使用要注意什麼安全事項？',
    answer: '1. 與窗簾、床單保持 1 公尺以上距離 2. 不要在上面烘衣服 3. 使用專用插座，避免延長線 4. 選購有傾倒斷電、過熱保護功能的機種 5. 定期清潔灰塵。',
    category: 'heater'
  },

  // 電風扇
  {
    question: 'DC 變頻電風扇比 AC 省多少電？',
    answer: 'DC 變頻約比 AC 定頻省 70-80% 電費。DC 風扇最低檔約 1-3W，AC 風扇約 30-50W。以每天使用 8 小時計算，一年可省約 300-400 元電費。',
    category: 'fan'
  },
  {
    question: '循環扇和一般電風扇差在哪？',
    answer: '循環扇產生螺旋氣流，用於加速室內空氣流動，搭配冷氣使用可讓冷氣更均勻分布。一般電風扇是直接對人吹的涼感風。循環扇不適合直接對人吹。',
    category: 'fan'
  },
  {
    question: '電風扇噪音多少 dB 算安靜？',
    answer: '20dB 以下極安靜，幾乎無聲；20-30dB 安靜，適合睡眠；30-40dB 一般，日常使用；40dB 以上會有明顯噪音。臥室使用建議選最低檔 30dB 以下的機種。',
    category: 'fan'
  },
  {
    question: '大廈扇適合什麼情況使用？',
    answer: '大廈扇（無扇葉設計）最大優點是安全，適合有幼兒或寵物的家庭。缺點是風量比傳統立扇小，價格也較高。如果空間小、注重安全，大廈扇是好選擇。',
    category: 'fan'
  },
  {
    question: '電風扇可以取代冷氣嗎？',
    answer: '電風扇只能產生風感降溫，無法真正降低室內溫度。當氣溫超過 32-33°C，光靠電風扇會不夠涼。建議電風扇搭配冷氣使用，可讓冷氣更省電。',
    category: 'fan'
  },
]

export function useFaqConfig() {
  const getAllFaqs = (): FAQItem[] => faqs

  const getFaqsByCategory = (category: string): FAQItem[] => {
    return faqs.filter(f => f.category === category)
  }

  const getFaqCategories = (): FAQCategory[] => faqCategories

  const getCategoryName = (slug: string): string => {
    const category = faqCategories.find(c => c.slug === slug)
    return category?.name || '其他'
  }

  return {
    getAllFaqs,
    getFaqsByCategory,
    getFaqCategories,
    getCategoryName,
    faqs,
    faqCategories
  }
}
