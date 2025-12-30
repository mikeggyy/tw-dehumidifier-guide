import { useHead } from '#imports'
import { structuredDataLogger as logger } from '~/utils/logger'

// 網站基本設定
const SITE_URL = 'https://www.jiadian-tw.work'
const SITE_NAME = '比比看'

interface ProductData {
  name: string
  description?: string
  image: string
  brand?: string
  model?: string
  sku?: string
  price: number
  originalPrice?: number
  url: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  category?: string
  specs?: Record<string, any>
  inStock?: boolean
}

interface FAQItem {
  question: string
  answer: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function useStructuredData() {
  // Product structured data (JSON-LD) - 增強版
  const setProductStructuredData = (product: ProductData) => {
    // 防護：確保必要欄位存在
    if (!product.name || !product.price) {
      logger.warn('Product structured data missing required fields:', { name: product.name, price: product.price })
      return
    }

    const availability = product.inStock === false ? 'OutOfStock' : (product.availability || 'InStock')

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.image || `${SITE_URL}/og-image.png`,
      description: product.description || `${product.name} - 查看詳細規格與最新優惠價格`,
      brand: product.brand ? {
        '@type': 'Brand',
        name: product.brand,
      } : undefined,
      model: product.model,
      category: product.category,
      offers: {
        '@type': 'Offer',
        url: product.url || SITE_URL,
        priceCurrency: 'TWD',
        price: product.price,
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availability: `https://schema.org/${availability}`,
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
      },
    }

    // 加入 SKU
    if (product.sku) {
      jsonLd.sku = product.sku
    }

    // Add high price if there's a discount
    if (product.originalPrice && product.originalPrice > product.price) {
      (jsonLd.offers as any).highPrice = product.originalPrice
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'product-jsonld',
        },
      ],
    })
  }

  // Breadcrumb structured data
  const setBreadcrumbStructuredData = (items: BreadcrumbItem[]) => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'breadcrumb-jsonld',
        },
      ],
    })
  }

  // Website structured data (for homepage)
  // Google 會使用 name 作為搜尋結果中的網站名稱
  const setWebsiteStructuredData = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '比比看',
      alternateName: ['家電比比看', '比比看家電', '比比看 家電規格比較'],
      description: '台灣最完整的家電規格比較網站，幫你找到最適合的除濕機、空氣清淨機、冷氣、電暖器、電風扇等家電',
      url: SITE_URL,
      inLanguage: 'zh-TW',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'website-jsonld',
        },
      ],
    })
  }

  // Organization structured data
  // Google 要求 logo 使用位圖格式 (PNG/JPG)，不支援 SVG
  const setOrganizationStructuredData = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon-192.png`,
        width: 192,
        height: 192,
      },
      description: '台灣家電規格比較與推薦網站',
      sameAs: [],
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'organization-jsonld',
        },
      ],
    })
  }

  // FAQPage structured data - 用於商品頁的常見問答
  const setFAQStructuredData = (faqs: FAQItem[]) => {
    if (!faqs || faqs.length === 0) return

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'faq-jsonld',
        },
      ],
    })
  }

  // ItemList structured data (for category pages)
  // 擴展版本：包含更多商品資訊以提高 Rich Snippet 機率
  const setItemListStructuredData = (items: { name: string; url: string; image: string; price: number }[]) => {
    // 增加到前 20 個商品以提升 SEO 效果
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 20).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
        image: item.image,
      })),
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'itemlist-jsonld',
        },
      ],
    })
  }

  // AggregateOffer structured data (for category pages - 價格範圍)
  const setAggregateOfferStructuredData = (categoryName: string, items: { price: number }[]) => {
    if (items.length === 0) return

    // 使用迴圈計算價格範圍，避免 Math.min/max 的 stack overflow 風險
    let minPrice = Infinity
    let maxPrice = -Infinity
    for (const item of items) {
      if (item.price < minPrice) minPrice = item.price
      if (item.price > maxPrice) maxPrice = item.price
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'AggregateOffer',
      priceCurrency: 'TWD',
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: items.length,
      itemCondition: 'https://schema.org/NewCondition',
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'aggregate-offer-jsonld',
        },
      ],
    })
  }

  // Brand structured data (for brand pages)
  interface BrandData {
    name: string
    slug: string
    description?: string
    country?: string
    officialUrl?: string
    productCount: number
    categories: string[]
  }

  const setBrandStructuredData = (brand: BrandData) => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Brand',
      name: brand.name,
      url: `${SITE_URL}/brand/${brand.slug}`,
      description: brand.description || `${brand.name} 家電商品比較`,
      logo: brand.officialUrl ? undefined : `${SITE_URL}/icon-192.png`,
      sameAs: brand.officialUrl ? [brand.officialUrl] : [],
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'brand-jsonld',
        },
      ],
    })
  }

  // CollectionPage structured data (for brand pages - 商品集合頁)
  interface CollectionPageData {
    name: string
    description: string
    url: string
    numberOfItems: number
  }

  const setCollectionPageStructuredData = (data: CollectionPageData) => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: data.name,
      description: data.description,
      url: data.url,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: data.numberOfItems,
      },
    }

    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
          key: 'collection-page-jsonld',
        },
      ],
    })
  }

  return {
    setProductStructuredData,
    setBreadcrumbStructuredData,
    setWebsiteStructuredData,
    setOrganizationStructuredData,
    setItemListStructuredData,
    setAggregateOfferStructuredData,
    setFAQStructuredData,
    setBrandStructuredData,
    setCollectionPageStructuredData,
    SITE_URL,
    SITE_NAME,
  }
}
