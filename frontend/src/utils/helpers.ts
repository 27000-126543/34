import { CUISINE_LABELS, DECOR_LABELS, CHEF_LEVEL_LABELS, INGREDIENT_CATEGORY_LABELS, RARITY_LABELS } from '../types'

export function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `¥${(amount / 100000000).toFixed(2)}亿`
  }
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`
  }
  return num.toLocaleString('zh-CN')
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getCuisineLabel(cuisineType: string): string {
  return CUISINE_LABELS[cuisineType] || cuisineType
}

export function getDecorLabel(decorStyle: string): string {
  return DECOR_LABELS[decorStyle] || decorStyle
}

export function getChefLevelLabel(level: string): string {
  return CHEF_LEVEL_LABELS[level] || level
}

export function getIngredientCategoryLabel(category: string): string {
  return INGREDIENT_CATEGORY_LABELS[category] || category
}

export function getRarityLabel(rarity: number): string {
  return RARITY_LABELS[rarity] || '普通'
}

export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-yellow-500'
  if (rating >= 3.5) return 'text-warm-500'
  if (rating >= 2.5) return 'text-orange-400'
  return 'text-gray-400'
}

export function getRarityBgColor(rarity: number): string {
  switch (rarity) {
    case 5:
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 4:
      return 'text-red-600 bg-red-50 border-red-200'
    case 3:
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 2:
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getChefLevelBgColor(level: string): string {
  switch (level) {
    case 'master':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'head_chef':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-warm-600 bg-warm-50 border-warm-200'
  }
}

export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0
  return ((revenue - cost) / revenue) * 100
}

export function calculatePriceChange(current: number, previous: number): { change: number; percentage: number; isUp: boolean } {
  const change = current - previous
  const percentage = previous === 0 ? 0 : (change / previous) * 100
  return {
    change,
    percentage: Math.abs(percentage),
    isUp: change >= 0,
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function getExpProgress(current: number, nextLevel: number): number {
  return Math.min(100, (current / nextLevel) * 100)
}

export function getNextLevelExp(level: number): number {
  return Math.floor(1000 * Math.pow(1.5, level - 1))
}

export function getChefExpForNextLevel(level: string): number {
  switch (level) {
    case 'apprentice':
      return 1000
    case 'head_chef':
      return 5000
    default:
      return Infinity
  }
}

export function getCompetitionStatusLabel(status: string): string {
  switch (status) {
    case 'upcoming':
      return '即将开始'
    case 'active':
      return '进行中'
    case 'completed':
      return '已结束'
    default:
      return status
  }
}

export function getCompetitionStatusColor(status: string): string {
  switch (status) {
    case 'upcoming':
      return 'text-blue-600 bg-blue-50'
    case 'active':
      return 'text-green-600 bg-green-50'
    case 'completed':
      return 'text-gray-600 bg-gray-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}
