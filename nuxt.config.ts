// https://nuxt.com/docs/api/configuration/nuxt-config

// Category slugs for multi-category support
const categorySlugs = [
  'dehumidifier',
  'air-purifier',
  'air-conditioner',
  'heater',
  'fan',
]

// Note: Product slugs are no longer hardcoded here.
// The crawler will automatically discover product pages from the category listing pages.
// This makes the config maintenance-free as product data comes from Supabase.

export default defineNuxtConfig({
  compatibilityDate: '2024-07-01',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/sitemap'
  ],

  // Runtime configuration (環境變數)
  runtimeConfig: {
    // Private keys (server-side only)
    // supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    // Public keys (exposed to client)
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://tqyefifafabyudtyjfam.supabase.co',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ioNYT5D-3-ZPObp82HK5Yg_EEFwrGD5',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.jiadian-tw.work',
      // SEO: Google Search Console 驗證碼 (可選)
      googleSiteVerification: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'zh-TW'
      },
      title: '比比看 - 台灣家電規格比較 2025 | 除濕機、空氣清淨機、冷氣',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: '2025 最完整的家電規格比較網站，收錄 Panasonic、Hitachi、LG 等品牌，提供除濕機、空氣清淨機、冷氣等家電的規格、價格比較，幫你找到最適合的家電。'
        },
        // PWA
        { name: 'theme-color', content: '#2563eb' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: '比比看' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:site_name', content: '比比看' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        // Site Name (輔助 Google 識別網站名稱)
        { name: 'application-name', content: '比比看' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        // DNS Prefetch for external resources
        { rel: 'dns-prefetch', href: 'https://tqyefifafabyudtyjfam.supabase.co' },
        { rel: 'preconnect', href: 'https://tqyefifafabyudtyjfam.supabase.co' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' }
      ],
      // Google Analytics 4
      script: [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-P32TQ7V2SZ',
          async: true
        },
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P32TQ7V2SZ');
          `
        }
      ]
    }
  },

  site: {
    url: 'https://www.jiadian-tw.work'
  },

  sitemap: {
    strictNuxtContentPaths: true,
    // SEO 優化設定
    // 注意: 不在 defaults 設定 lastmod，避免每次 build 都更新所有頁面的時間戳
    // 商品頁面的 lastmod 由爬蟲資料的 updated_at 決定（透過 crawler 自動發現）
    defaults: {
      changefreq: 'weekly',
      priority: 0.7,
    },
    // 根據頁面類型設定不同優先級和更新頻率
    urls: [
      {
        loc: '/',
        changefreq: 'daily',
        priority: 1.0,
      },
      // 品類頁面 - 高優先級，每日更新（商品資料每天同步）
      ...categorySlugs.map(slug => ({
        loc: `/${slug}`,
        changefreq: 'daily',
        priority: 0.9,
      })),
      // 指南頁面 - 靜態內容，更新頻率較低
      { loc: '/guide', changefreq: 'weekly', priority: 0.8 },
      { loc: '/guide/dehumidifier-buying-guide', changefreq: 'monthly', priority: 0.7 },
      { loc: '/guide/air-purifier-buying-guide', changefreq: 'monthly', priority: 0.7 },
      { loc: '/guide/air-conditioner-buying-guide', changefreq: 'monthly', priority: 0.7 },
      { loc: '/guide/heater-buying-guide', changefreq: 'monthly', priority: 0.7 },
      { loc: '/guide/fan-buying-guide', changefreq: 'monthly', priority: 0.7 },
      { loc: '/guide/dehumidifier-vs-air-purifier', changefreq: 'monthly', priority: 0.7 },
      // 品牌頁面
      { loc: '/brand', changefreq: 'weekly', priority: 0.8 },
      // 比較頁面 - 動態內容，不需要被索引
      { loc: '/compare', changefreq: 'weekly', priority: 0.5 },
    ],
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        // Category listing pages (crawler will discover product pages from here)
        ...categorySlugs.map(slug => `/${slug}`),
        // Guide pages
        '/guide',
        '/guide/dehumidifier-buying-guide',
        '/guide/air-purifier-buying-guide',
        '/guide/air-conditioner-buying-guide',
        '/guide/heater-buying-guide',
        '/guide/fan-buying-guide',
        '/guide/dehumidifier-vs-air-purifier',
        // Brand pages
        '/brand',
        // Compare page
        '/compare',
      ],
      // Ignore static files that are served from public folder
      ignore: ['/manifest.json', '/favicon.svg', '/icon-192.png', '/screenshot-wide.png', '/screenshot-narrow.png'],
      failOnError: false,
    }
  },

  // Generate static site
  ssr: true,

  // Completely disable component auto-imports to work around Windows path bug
  components: {
    dirs: []
  },

  // Disable auto-imports for composables
  imports: {
    dirs: []
  }
})
