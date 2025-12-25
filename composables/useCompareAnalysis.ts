import { computed } from 'vue'
import type { ComparableProduct } from '~/types'
import { getProductSpec } from '~/types'

export interface CompareConclusion {
  winner: ComparableProduct | null
  recommendations: {
    budget: { product: ComparableProduct; reason: string } | null
    quiet: { product: ComparableProduct; reason: string } | null
    powerful: { product: ComparableProduct; reason: string } | null
    value: { product: ComparableProduct; reason: string } | null
    overall: { product: ComparableProduct; reason: string } | null
  }
  summary: string
}

export interface WeightConfig {
  price: number      // 價格重要性 0-100
  capacity: number   // 除濕力重要性 0-100
  noise: number      // 安靜度重要性 0-100
  efficiency: number // 能效重要性 0-100
}

export const defaultWeights: WeightConfig = {
  price: 25,
  capacity: 25,
  noise: 25,
  efficiency: 25
}

// 輔助函數：取得商品規格值
const getSpec = (product: ComparableProduct, key: string): number | null => {
  return getProductSpec<number>(product, key)
}

export function useCompareAnalysis(products: () => ComparableProduct[], weights: () => WeightConfig = () => defaultWeights) {

  // 預先計算商品統計資料（快取 min/max 值，避免 O(n²)）
  const productStats = computed(() => {
    const prods = products()
    if (prods.length === 0) {
      return {
        minPrice: 0, maxPrice: 0,
        maxCapacity: 1,
        minNoise: 30, maxNoise: 60
      }
    }

    // 使用 reduce 避免 Math.min/max 的 stack overflow 風險
    let minPrice = Infinity, maxPrice = -Infinity
    let maxCapacity = 0
    let minNoise = Infinity, maxNoise = -Infinity
    let hasValidNoise = false

    for (const p of prods) {
      // Price
      if (p.price < minPrice) minPrice = p.price
      if (p.price > maxPrice) maxPrice = p.price

      // Capacity
      const capacity = getSpec(p, 'daily_capacity') ?? 0
      if (capacity > maxCapacity) maxCapacity = capacity

      // Noise
      const noise = getSpec(p, 'noise_level')
      if (noise !== null && noise < 99) {
        hasValidNoise = true
        if (noise < minNoise) minNoise = noise
        if (noise > maxNoise) maxNoise = noise
      }
    }

    return {
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
      maxCapacity: maxCapacity || 1,
      minNoise: hasValidNoise ? minNoise : 30,
      maxNoise: hasValidNoise ? maxNoise : 60
    }
  })

  // 計算加權評分（使用快取的統計資料，O(1)）
  const calculateWeightedScore = (
    product: ComparableProduct,
    stats: typeof productStats.value,
    w: WeightConfig
  ): number => {
    const total = w.price + w.capacity + w.noise + w.efficiency
    if (total === 0) return 0

    const { minPrice, maxPrice, maxCapacity, minNoise, maxNoise } = stats

    // 正規化各項指標 (0-100)
    const priceScore = maxPrice > minPrice
      ? 100 - ((product.price - minPrice) / (maxPrice - minPrice) * 100)
      : 100

    const dailyCapacity = getSpec(product, 'daily_capacity')
    const capacityScore = dailyCapacity
      ? (dailyCapacity / maxCapacity) * 100
      : 0

    const noiseLevel = getSpec(product, 'noise_level')
    const noiseScore = noiseLevel && maxNoise > minNoise
      ? 100 - ((noiseLevel - minNoise) / (maxNoise - minNoise) * 100)
      : 50

    const energyEfficiency = getSpec(product, 'energy_efficiency')
    const efficiencyScore = energyEfficiency
      ? (6 - energyEfficiency) * 20  // 1級=100, 5級=20
      : 50

    return (
      (priceScore * w.price / total) +
      (capacityScore * w.capacity / total) +
      (noiseScore * w.noise / total) +
      (efficiencyScore * w.efficiency / total)
    )
  }

  // 計算商品排名（O(n) 複雜度）
  const rankedProducts = computed(() => {
    const prods = products()
    const w = weights()
    const stats = productStats.value

    return prods
      .map(p => ({
        product: p,
        score: calculateWeightedScore(p, stats, w)
      }))
      .sort((a, b) => b.score - a.score)
  })

  // 生成比較結論
  const conclusions = computed((): CompareConclusion => {
    const prods = products()
    if (prods.length === 0) {
      return {
        winner: null,
        recommendations: { budget: null, quiet: null, powerful: null, value: null, overall: null },
        summary: ''
      }
    }

    // 找出各類別最佳
    const sortedByPrice = [...prods].sort((a, b) => a.price - b.price)
    const budgetPick = sortedByPrice[0]

    const sortedByNoise = [...prods].sort((a, b) => (getSpec(a, 'noise_level') ?? 99) - (getSpec(b, 'noise_level') ?? 99))
    const quietPick = sortedByNoise[0]

    const sortedByCapacity = [...prods].sort((a, b) => (getSpec(b, 'daily_capacity') ?? 0) - (getSpec(a, 'daily_capacity') ?? 0))
    const powerfulPick = sortedByCapacity[0]

    const sortedByValue = [...prods].sort((a, b) => {
      const aCapacity = getSpec(a, 'daily_capacity')
      const bCapacity = getSpec(b, 'daily_capacity')
      const aVal = aCapacity ? a.price / aCapacity : Infinity
      const bVal = bCapacity ? b.price / bCapacity : Infinity
      return aVal - bVal
    })
    const valuePick = sortedByValue[0]

    // 綜合評分最高
    const ranked = rankedProducts.value
    const overallPick = ranked.length > 0 ? ranked[0].product : prods[0]

    // 生成推薦理由
    const formatPrice = (p: number) => p.toLocaleString()

    const quietNoise = getSpec(quietPick, 'noise_level')
    const powerfulCapacity = getSpec(powerfulPick, 'daily_capacity')
    const valueCapacity = getSpec(valuePick, 'daily_capacity')

    const recommendations = {
      budget: budgetPick ? {
        product: budgetPick,
        reason: `價格最低 NT$${formatPrice(budgetPick.price)}`
      } : null,
      quiet: quietNoise ? {
        product: quietPick,
        reason: `最安靜 ${quietNoise}dB`
      } : null,
      powerful: powerfulCapacity ? {
        product: powerfulPick,
        reason: `除濕力最強 ${powerfulCapacity}L/日`
      } : null,
      value: valueCapacity ? {
        product: valuePick,
        reason: `CP值最高 $${Math.round(valuePick.price / valueCapacity)}/L`
      } : null,
      overall: overallPick ? {
        product: overallPick,
        reason: '綜合表現最佳'
      } : null
    }

    // 生成總結
    let summary = ''
    const uniqueWinners = new Set([
      budgetPick?.id,
      quietPick?.id,
      powerfulPick?.id,
      valuePick?.id,
      overallPick?.id
    ].filter(Boolean))

    if (uniqueWinners.size === 1) {
      const winner = overallPick
      summary = `🏆 ${winner.brand} ${winner.model} 在各項指標都表現最佳，是這次比較的全能冠軍！`
    } else if (prods.length === 2) {
      const p1 = prods[0]
      const p2 = prods[1]
      const p1Wins: string[] = []
      const p2Wins: string[] = []

      if (p1.price < p2.price) p1Wins.push('價格')
      else if (p2.price < p1.price) p2Wins.push('價格')

      const p1Capacity = getSpec(p1, 'daily_capacity') ?? 0
      const p2Capacity = getSpec(p2, 'daily_capacity') ?? 0
      if (p1Capacity > p2Capacity) p1Wins.push('除濕力')
      else if (p2Capacity > p1Capacity) p2Wins.push('除濕力')

      const p1Noise = getSpec(p1, 'noise_level') ?? 99
      const p2Noise = getSpec(p2, 'noise_level') ?? 99
      if (p1Noise < p2Noise) p1Wins.push('安靜度')
      else if (p2Noise < p1Noise) p2Wins.push('安靜度')

      if (p1Wins.length > p2Wins.length) {
        summary = `📊 ${p1.brand} ${p1.model} 在${p1Wins.join('、')}方面勝出`
      } else if (p2Wins.length > p1Wins.length) {
        summary = `📊 ${p2.brand} ${p2.model} 在${p2Wins.join('、')}方面勝出`
      } else {
        summary = `⚖️ 兩款各有優勢：${p1.brand}勝在${p1Wins.join('、')}，${p2.brand}勝在${p2Wins.join('、')}`
      }
    } else {
      summary = `📊 ${prods.length}款商品各有特色，請根據您的需求選擇`
    }

    return {
      winner: overallPick,
      recommendations,
      summary
    }
  })

  // 找出有差異的規格
  const specsWithDifference = computed(() => {
    const prods = products()
    if (prods.length < 2) return []

    const specKeys = [
      { key: 'price', label: '促銷價', hasDiff: false },
      { key: 'original_price', label: '市售價', hasDiff: false },
      { key: 'daily_capacity', label: '日除濕量', hasDiff: false },
      { key: 'tank_capacity', label: '水箱容量', hasDiff: false },
      { key: 'noise_level', label: '噪音值', hasDiff: false },
      { key: 'power_consumption', label: '消耗功率', hasDiff: false },
      { key: 'energy_efficiency', label: '能源效率', hasDiff: false }
    ]

    specKeys.forEach(spec => {
      const values = prods.map(p => getSpec(p, spec.key)).filter(v => v != null)
      if (values.length > 1) {
        const uniqueValues = new Set(values)
        spec.hasDiff = uniqueValues.size > 1
      }
    })

    return specKeys.filter(s => s.hasDiff).map(s => s.key)
  })

  return {
    rankedProducts,
    conclusions,
    specsWithDifference,
    calculateWeightedScore
  }
}
