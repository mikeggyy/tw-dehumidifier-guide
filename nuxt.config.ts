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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://bibikan.tw',
    }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'zh-TW'
      },
      title: '比比看 | 家電規格比較 2025 - 除濕機、空氣清淨機、冷氣',
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
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' }
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
    url: 'https://dehumidifier-compare.vercel.app'
  },

  sitemap: {
    strictNuxtContentPaths: true
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        // Category listing pages (crawler will discover product pages from here)
        ...categorySlugs.map(slug => `/${slug}`),
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
