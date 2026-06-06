import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  Player, Restaurant, Chef, Dish, Ingredient, Inventory, Recipe,
  ChefEquipment, Competition, Alliance, Duel, DailyReport,
  LoginRequest, RegisterRequest, AuthResponse, MarketTransaction, LeaderboardEntry
} from '../types'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('player')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data),
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post('/auth/register', data),
  logout: (): Promise<{ success: boolean }> =>
    api.post('/auth/logout'),
  getCurrentPlayer: (): Promise<AuthResponse> =>
    api.get('/auth/me'),
}

export const restaurantApi = {
  list: (): Promise<{ restaurants: Restaurant[] }> =>
    api.get('/restaurants'),
  listAll: (): Promise<{ restaurants: Restaurant[] }> =>
    api.get('/restaurants/all'),
  get: (id: number): Promise<{ restaurant: Restaurant }> =>
    api.get(`/restaurants/${id}`),
  create: (data: { name: string; cuisine_type: string; decor_style: string }): Promise<{ restaurant: Restaurant }> =>
    api.post('/restaurants', data),
  update: (id: number, data: Partial<Restaurant>): Promise<{ restaurant: Restaurant }> =>
    api.put(`/restaurants/${id}`, data),
  getInventory: (id: number): Promise<{ inventory: Inventory[]; total_value: number }> =>
    api.get(`/restaurants/${id}/inventory`),
  refreshRating: (id: number): Promise<{ new_rating: number }> =>
    api.post(`/restaurants/${id}/refresh-rating`),
}

export const chefApi = {
  listByRestaurant: (restaurantId: number): Promise<{ chefs: Chef[]; avg_skill: number; best_chef: Chef }> =>
    api.get(`/chefs/restaurant/${restaurantId}`),
  get: (id: number): Promise<{ chef: Chef }> =>
    api.get(`/chefs/${id}`),
  hire: (data: { restaurant_id: number; name: string }): Promise<{ chef: Chef }> =>
    api.post('/chefs', data),
  update: (id: number, data: Partial<Chef>): Promise<{ chef: Chef }> =>
    api.put(`/chefs/${id}`, data),
  fire: (id: number): Promise<{ success: boolean }> =>
    api.delete(`/chefs/${id}`),
  approvePromotion: (id: number): Promise<{ chef: Chef }> =>
    api.post(`/chefs/${id}/promote/approve`),
  rejectPromotion: (id: number): Promise<{ chef: Chef }> =>
    api.post(`/chefs/${id}/promote/reject`),
  getPending: (restaurantId: number): Promise<{ pending_promotions: Chef[] }> =>
    api.get(`/chefs/pending/${restaurantId}`),
}

export const dishApi = {
  listAll: (): Promise<{ dishes: Dish[] }> =>
    api.get('/dishes'),
  listByRestaurant: (restaurantId: number): Promise<{ dishes: Dish[] }> =>
    api.get(`/dishes/restaurant/${restaurantId}`),
  get: (id: number): Promise<{ dish: Dish }> =>
    api.get(`/dishes/${id}`),
  create: (data: { restaurant_id: number; name: string; cuisine_type: string; ingredients_json?: any[]; base_price: number; is_rare?: boolean }): Promise<{ dish: Dish }> =>
    api.post('/dishes', data),
  update: (id: number, data: Partial<Dish>): Promise<{ dish: Dish }> =>
    api.put(`/dishes/${id}`, data),
  delete: (id: number): Promise<{ success: boolean }> =>
    api.delete(`/dishes/${id}`),
  listRecipes: (cuisine_type?: string, max_difficulty?: number): Promise<{ recipes: Recipe[] }> =>
    api.get('/dishes/recipes', { params: { cuisine_type, max_difficulty } }),
  listEquipment: (type?: string): Promise<{ equipment: ChefEquipment[] }> =>
    api.get('/dishes/equipment', { params: { type } }),
  develop: (data: { restaurant_id: number; recipe_id: number; chef_id: number }): Promise<any> =>
    api.post('/dishes/develop', data),
  unlockRecipe: (data: { recipe_id: number }): Promise<any> =>
    api.post('/dishes/unlock-recipe', data),
  distributeResearchPoints: (data: { target_id: number; amount: number; type: string }): Promise<any> =>
    api.post('/dishes/research-points', data),
  refreshRating: (id: number, chef_id: number): Promise<{ new_rating: number }> =>
    api.post(`/dishes/${id}/refresh-rating`, { chef_id }),
}

export const marketApi = {
  listIngredients: (category?: string): Promise<{ ingredients: Ingredient[] }> =>
    api.get('/market/ingredients', { params: { category } }),
  getIngredient: (id: number): Promise<{ ingredient: Ingredient }> =>
    api.get(`/market/ingredients/${id}`),
  getSummary: (): Promise<{ market_summary: Ingredient[] }> =>
    api.get('/market/summary'),
  getTransactions: (limit?: number): Promise<{ transactions: MarketTransaction[] }> =>
    api.get('/market/transactions', { params: { limit } }),
  updatePrices: (): Promise<{ updated_count: number; updates: any[] }> =>
    api.post('/market/update-prices'),
  triggerSeasonalEvent: (): Promise<any> =>
    api.post('/market/seasonal-event'),
  buy: (data: { restaurant_id: number; ingredient_id: number; quantity: number }): Promise<any> =>
    api.post('/market/buy', data),
  sell: (data: { restaurant_id: number; ingredient_id: number; quantity: number }): Promise<any> =>
    api.post('/market/sell', data),
  trade: (data: { buyer_restaurant_id: number; seller_restaurant_id: number; ingredient_id: number; quantity: number; agreed_price: number }): Promise<any> =>
    api.post('/market/trade', data),
}

export const competitionApi = {
  listActive: (): Promise<{ competitions: Competition[] }> =>
    api.get('/competitions'),
  listUpcoming: (): Promise<{ competitions: Competition[] }> =>
    api.get('/competitions/upcoming'),
  listCompleted: (): Promise<{ competitions: Competition[] }> =>
    api.get('/competitions/completed'),
  get: (id: number): Promise<{ competition: Competition }> =>
    api.get(`/competitions/${id}`),
  create: (data: { date: string }): Promise<{ competition: Competition }> =>
    api.post('/competitions', data),
  register: (id: number, data: { restaurant_id: number }): Promise<any> =>
    api.post(`/competitions/${id}/register`, data),
  unregister: (id: number, data: { restaurant_id: number }): Promise<any> =>
    api.post(`/competitions/${id}/unregister`, data),
  start: (id: number): Promise<any> =>
    api.post(`/competitions/${id}/start`),
  executeRound: (id: number): Promise<{ results: any[] }> =>
    api.post(`/competitions/${id}/execute`),
  complete: (id: number): Promise<any> =>
    api.post(`/competitions/${id}/complete`),
  match: (id: number): Promise<{ matches: any[] }> =>
    api.post(`/competitions/${id}/match`),
}

export const allianceApi = {
  list: (): Promise<{ alliances: Alliance[] }> =>
    api.get('/alliances'),
  listByPlayer: (): Promise<{ alliances: Alliance[] }> =>
    api.get('/alliances/player'),
  get: (id: number): Promise<any> =>
    api.get(`/alliances/${id}`),
  create: (data: { name: string }): Promise<any> =>
    api.post('/alliances', data),
  join: (id: number): Promise<any> =>
    api.post(`/alliances/${id}/join`),
  leave: (id: number): Promise<any> =>
    api.post(`/alliances/${id}/leave`),
  disband: (id: number): Promise<any> =>
    api.delete(`/alliances/${id}`),
  getInventory: (id: number): Promise<{ inventory: Inventory[] }> =>
    api.get(`/alliances/${id}/inventory`),
  shareInventory: (id: number, data: { from_restaurant_id: number; to_restaurant_id: number; ingredient_id: number; quantity: number }): Promise<any> =>
    api.post(`/alliances/${id}/share`, data),
  getDuels: (id: number): Promise<{ duels: Duel[] }> =>
    api.get(`/alliances/${id}/duels`),
  initiateDuel: (data: { challenger_restaurant_id: number; defender_restaurant_id: number }): Promise<any> =>
    api.post('/alliances/duels', data),
  executeDuel: (duelId: number): Promise<any> =>
    api.post(`/alliances/duels/${duelId}/execute`),
}

export const reportApi = {
  getStats: (restaurantId: number): Promise<{ stats: any }> =>
    api.get(`/reports/stats/${restaurantId}`),
  getDaily: (restaurantId: number, date?: string): Promise<{ report: DailyReport }> =>
    api.get(`/reports/daily/${restaurantId}`, { params: { date } }),
  getWeekly: (restaurantId: number, end_date?: string): Promise<{ weekly: any }> =>
    api.get(`/reports/weekly/${restaurantId}`, { params: { end_date } }),
  getRange: (restaurantId: number, start_date: string, end_date: string): Promise<{ reports: DailyReport[] }> =>
    api.get(`/reports/range/${restaurantId}`, { params: { start_date, end_date } }),
  getRadarChart: (restaurantId: number): Promise<{ chart_data: any }> =>
    api.get(`/reports/chart/radar/${restaurantId}`),
  getLineChart: (restaurantId: number): Promise<{ chart_data: any }> =>
    api.get(`/reports/chart/line/${restaurantId}`),
  exportPDF: (restaurantId: number): Promise<Blob> =>
    api.get(`/reports/export/${restaurantId}`, { responseType: 'blob' }),
}

export const leaderboardApi = {
  getAll: (): Promise<any> =>
    api.get('/leaderboards'),
  getProfit: (limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> =>
    api.get('/leaderboards/profit', { params: { limit } }),
  getRating: (limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> =>
    api.get('/leaderboards/rating', { params: { limit } }),
  getChefLevel: (limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> =>
    api.get('/leaderboards/chef-level', { params: { limit } }),
  getReputation: (limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> =>
    api.get('/leaderboards/reputation', { params: { limit } }),
  getDishPopularity: (limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> =>
    api.get('/leaderboards/dish-popularity', { params: { limit } }),
  getAlliance: (limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> =>
    api.get('/leaderboards/alliance', { params: { limit } }),
  getCuisineStats: (): Promise<{ cuisine_stats: any[] }> =>
    api.get('/leaderboards/cuisine-stats'),
  getMyRank: (): Promise<{ rank: any }> =>
    api.get('/leaderboards/my-rank'),
}

export default api
