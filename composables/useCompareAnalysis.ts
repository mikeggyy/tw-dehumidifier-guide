import { computed } from 'vue'
import type { Dehumidifier } from '~/types'

export interface CompareConclusion {
  winner: Dehumidifier | null
  recommendations: {
    budget: { product: Dehumidifier; reason: string } | null
    quiet: { product: Dehumidifier; reason: string } | null
    powerful: { product: Dehumidifier; reason: string } | null
    value: { product: Dehumidifier; reason: string } | null
    overall: { product: Dehumidifier; reason: string } | null
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

export function useCompareAnalysis(products: () => Dehumidifier[], weights: () => WeightConfig = () => defaultWeights) {

  // 計算加權評分
  const calculateWeightedScore = (product: Dehumidifier, allProducts: Dehumidifier[], w: WeightConfig): number => {
    const total = w.price + w.capacity + w.noise + w.efficiency
    if (total === 0) return 0

    // 正規化各項指標 (0-100)
    const prices = allProducts.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceScore = maxPrice > minPrice
      ? 100 - ((product.price - minPrice) / (maxPrice - minPrice) * 100)
      : 100

    const capacities = allProducts.map(p => p.daily_capacity ?? 0).filter(c => c > 0)
    const maxCapacity = capacities.length > 0 ? Math.max(...capacities) : 1
    const capacityScore = product.daily_capacity
      ? (product.daily_capacity / maxCapacity) * 100
      : 0

    const noises = allProducts.map(p => p.noise_level ?? 99).filter(n => n < 99)
    const minNoise = noises.length > 0 ? Math.min(...noises) : 30
    const maxNoise = noises.length > 0 ? Math.max(...noises) : 60
    const noiseScore = product.noise_level && maxNoise > minNoise
      ? 100 - ((product.noise_level - minNoise) / (maxNoise - minNoise) * 100)
      : 50

    const efficiencies = allProducts.map(p => p.energy_efficiency ?? 5)
    const efficiencyScore = product.energy_efficiency
      ? (6 - product.energy_efficiency) * 20  // 1級=100, 5級=20
      : 50

    return (
      (priceScore * w.price / total) +
      (capacityScore * w.capacity / total) +
      (noiseScore * w.noise / total) +
      (efficiencyScore * w.efficiency / total)
    )
  }

  // 計算商品排名
  const rankedProducts = computed(() => {
    const prods = products()
    const w = weights()

    return prods
      .map(p => ({
        product: p,
        score: calculateWeightedScore(p, prods, w)
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

    const sortedByNoise = [...prods].sort((a, b) => (a.noise_level ?? 99) - (b.noise_level ?? 99))
    const quietPick = sortedByNoise[0]

    const sortedByCapacity = [...prods].sort((a, b) => (b.daily_capacity ?? 0) - (a.daily_capacity ?? 0))
    const powerfulPick = sortedByCapacity[0]

    const sortedByValue = [...prods].sort((a, b) => {
      const aVal = a.daily_capacity ? a.price / a.daily_capacity : Infinity
      const bVal = b.daily_capacity ? b.price / b.daily_capacity : Infinity
      return aVal - bVal
    })
    const valuePick = sortedByValue[0]

    // 綜合評分最高
    const ranked = rankedProducts.value
    const overallPick = ranked.length > 0 ? ranked[0].product : prods[0]

    // 生成推薦理由
    const formatPrice = (p: number) => p.toLocaleString()

    const recommendations = {
      budget: budgetPick ? {
        product: budgetPick,
        reason: `價格最低 NT$${formatPrice(budgetPick.price)}`
      } : null,
      quiet: quietPick?.noise_level ? {
        product: quietPick,
        reason: `最安靜 ${quietPick.noise_level}dB`
      } : null,
      powerful: powerfulPick?.daily_capacity ? {
        product: powerfulPick,
        reason: `除濕力最強 ${powerfulPick.daily_capacity}L/日`
      } : null,
      value: valuePick?.daily_capacity ? {
        product: valuePick,
        reason: `CP值最高 $${Math.round(valuePick.price / valuePick.daily_capacity)}/L`
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

      if ((p1.daily_capacity ?? 0) > (p2.daily_capacity ?? 0)) p1Wins.push('除濕力')
      else if ((p2.daily_capacity ?? 0) > (p1.daily_capacity ?? 0)) p2Wins.push('除濕力')

      if ((p1.noise_level ?? 99) < (p2.noise_level ?? 99)) p1Wins.push('安靜度')
      else if ((p2.noise_level ?? 99) < (p1.noise_level ?? 99)) p2Wins.push('安靜度')

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
      const values = prods.map(p => (p as any)[spec.key]).filter(v => v != null)
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
