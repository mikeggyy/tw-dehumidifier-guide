// https://nuxt.com/docs/api/configuration/nuxt-config

// Product slugs for static generation (auto-generated from scraped data)
const productSlugs = [
  'electrolux-14631265',
  'only-12896294',
  'panasonic-14425700',
  'xiaomi-12537937',
  'heran-9352697',
  'sampo-14034959',
  'hitachi-11627154',
  'sampo-13652807',
  'panasonic-14503246',
  'sharp-14478956',
  'only-12893995',
  'xiaomi-12537939',
  'whirlpool-12984065',
  'hitachi-12049653',
  'xiaomi-12419330',
  'electrolux-13247986',
  'sampo-9769209',
  'tatung-14596883',
  'hitachi-14471077'
]

export default defineNuxtConfig({
  compatibilityDate: '2024-07-01',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/sitemap'
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-TW'
      },
      title: '除濕機比較推薦 2025 | 規格、價格、評價一次看',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '2025 最完整的除濕機規格比較網站，收錄 Panasonic、Hitachi、LG 等品牌，提供日除濕量、噪音、能效比較，幫你找到最適合的除濕機。'
        },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:site_name', content: '除濕機比較推薦' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
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
      routes: ['/', ...productSlugs.map(slug => `/product/${slug}`)]
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
