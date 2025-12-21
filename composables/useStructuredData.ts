import { useHead } from '#imports'

// 網站基本設定
const SITE_URL = 'https://www.jiadian-tw.work'
const SITE_NAME = '家電比比看'

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
    const availability = product.inStock === false ? 'OutOfStock' : (product.availability || 'InStock')

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.image,
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
  const setWebsiteStructuredData = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      description: '台灣最完整的家電規格比較網站，幫你找到最適合的除濕機、空氣清淨機、冷氣、電暖器、電風扇等家電',
      url: SITE_URL,
      inLanguage: 'zh-TW',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/dehumidifier?q={search_term_string}`,
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
  const setOrganizationStructuredData = () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
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
  const setItemListStructuredData = (items: { name: string; url: string; image: string; price: number }[]) => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.slice(0, 10).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: item.name,
          image: item.image,
          url: item.url,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'TWD',
            price: item.price,
          },
        },
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

  return {
    setProductStructuredData,
    setBreadcrumbStructuredData,
    setWebsiteStructuredData,
    setOrganizationStructuredData,
    setItemListStructuredData,
    setFAQStructuredData,
    SITE_URL,
    SITE_NAME,
  }
}
