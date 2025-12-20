import { useHead } from '#imports'

interface ProductData {
  name: string
  description?: string
  image: string
  brand?: string
  model?: string
  price: number
  originalPrice?: number
  url: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  category?: string
  specs?: Record<string, any>
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function useStructuredData() {
  // Product structured data (JSON-LD)
  const setProductStructuredData = (product: ProductData) => {
    const jsonLd = {
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
        url: product.url,
        priceCurrency: 'TWD',
        price: product.price,
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availability: `https://schema.org/${product.availability || 'InStock'}`,
        itemCondition: 'https://schema.org/NewCondition',
      },
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
      name: '比比看',
      description: '台灣最完整的家電規格比較網站，幫你找到最適合的除濕機、空氣清淨機等家電',
      url: 'https://bibikan.tw',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://bibikan.tw/dehumidifier?q={search_term_string}',
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
      name: '比比看',
      url: 'https://bibikan.tw',
      logo: 'https://bibikan.tw/favicon.svg',
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
  }
}
