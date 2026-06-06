export interface Player {
  id: number
  username: string
  email: string
  coins: number
  reputation: number
  research_points: number
  created_at: string
}

export interface Restaurant {
  id: number
  owner_id: number
  name: string
  cuisine_type: 'chinese' | 'french' | 'italian' | 'japanese' | 'mexican' | 'indian'
  decor_style: 'modern' | 'classic' | 'casual' | 'luxury' | 'ethnic'
  level: number
  total_profit: number
  avg_rating: number
  alliance_id: number | null
  created_at: string
  chefs?: Chef[]
  dishes?: Dish[]
}

export type ChefLevel = 'apprentice' | 'head_chef' | 'master'

export interface Chef {
  id: number
  restaurant_id: number
  name: string
  level: ChefLevel
  skill: number
  exp: number
  pending_promotion: number
}

export interface Dish {
  id: number
  restaurant_id: number
  name: string
  cuisine_type: string
  ingredients_json: { ingredient_id: number; quantity: number }[]
  base_price: number
  rating: number
  sales_count: number
  is_rare: boolean
}

export interface Ingredient {
  id: number
  name: string
  category: 'meat' | 'vegetable' | 'seafood' | 'spice' | 'grain' | 'dairy'
  rarity: number
  base_price: number
  current_price: number
  freshness_days: number
  season_affect: number
  transaction_volume?: number
  avg_price_24h?: number
  price_change?: number
}

export interface Inventory {
  id: number
  restaurant_id: number
  ingredient_id: number
  quantity: number
  freshness: number
  ingredient_name?: string
  category?: string
  current_price?: number
  base_price?: number
}

export interface Recipe {
  id: number
  name: string
  cuisine_type: string
  ingredients_json: { ingredient_id: number; quantity: number }[]
  difficulty: number
  rarity: number
  is_unlockable: boolean
  cost_points: number
}

export interface ChefEquipment {
  id: number
  name: string
  type: 'knife' | 'pan' | 'utensil' | 'decor'
  bonus_skill: number
  rarity: number
  cost_points: number
}

export type CompetitionStatus = 'upcoming' | 'active' | 'completed'

export interface Competition {
  id: number
  date: string
  status: CompetitionStatus
  participants_json: number[]
  results_json: any[]
  participants_details?: {
    id: number
    name: string
    cuisine_type: string
    level: number
    avg_rating: number
    total_profit: number
  }[]
}

export interface Alliance {
  id: number
  name: string
  founder_id: number
  members_json: number[]
  created_at: string
  founder?: { id: number; username: string }
}

export type DuelStatus = 'active' | 'completed'

export interface Duel {
  id: number
  challenger_id: number
  defender_id: number
  status: DuelStatus
  dish_results_json: any[]
  winner_id: number | null
  start_time: string
  end_time: string | null
}

export interface DailyReport {
  id: number
  restaurant_id: number
  date: string
  total_revenue: number
  total_cost: number
  customer_count: number
  satisfaction_avg: number
  popular_dishes_json: {
    dish_id: number
    name: string
    sales_count: number
    rating: number
    revenue: number
  }[]
  ingredient_costs_json: {
    ingredient_id: number
    name: string
    quantity: number
    total_cost: number
  }[]
  satisfaction_trend_json: {
    date: string
    satisfaction: number
  }[]
}

export interface MarketTransaction {
  id: number
  buyer_id: number
  seller_id: number
  ingredient_id: number
  quantity: number
  price: number
  timestamp: string
  ingredient_name?: string
  buyer_name?: string
  seller_name?: string
}

export interface LeaderboardEntry {
  rank: number
  [key: string]: any
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  restaurant_name: string
  cuisine_type: string
  decor_style: string
}

export interface AuthResponse {
  token: string
  player: Player
  restaurant: Restaurant | null
  chefs: Chef[]
  dishes: Dish[]
}

export interface SocketEventMap {
  'market:update': { type: string; data: any }
  'competition:update': { type: string; data: any }
  'duel:update': { type: string; data: any }
  'restaurant:update': { type: string; data: any }
  'notification': { message: string; type: 'info' | 'success' | 'warning' | 'error' }
  'price:update': { ingredientId: number; newPrice: number }
  'chef:promotionRequest': { chefId: number; chefName: string }
}

export const CUISINE_LABELS: Record<string, string> = {
  chinese: '中式',
  french: '法式',
  italian: '意式',
  japanese: '日式',
  mexican: '墨西哥',
  indian: '印度'
}

export const DECOR_LABELS: Record<string, string> = {
  modern: '现代简约',
  classic: '古典优雅',
  casual: '休闲舒适',
  luxury: '豪华尊贵',
  ethnic: '民族风情'
}

export const CHEF_LEVEL_LABELS: Record<string, string> = {
  apprentice: '学徒',
  head_chef: '主厨',
  master: '大师'
}

export const INGREDIENT_CATEGORY_LABELS: Record<string, string> = {
  meat: '肉类',
  vegetable: '蔬菜',
  seafood: '海鲜',
  spice: '香料',
  grain: '谷物',
  dairy: '乳制品'
}

export const RARITY_LABELS: Record<number, string> = {
  1: '普通',
  2: '优质',
  3: '稀有',
  4: '史诗',
  5: '传说'
}
