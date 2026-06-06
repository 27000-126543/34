import React, { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react'
import type { Player, Restaurant, Chef, Ingredient, Dish } from '../types'
import { authApi, chefApi, marketApi, dishApi, restaurantApi } from '../services/api'
import { gameSocket } from '../services/socket'

interface GameState {
  player: Player | null
  restaurant: Restaurant | null
  chefs: Chef[]
  dishes: Dish[]
  ingredients: Ingredient[]
  isAuthenticated: boolean
  isLoading: boolean
  notifications: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[]
}

type GameAction =
  | { type: 'SET_PLAYER'; payload: Player | null }
  | { type: 'SET_RESTAURANT'; payload: Restaurant | null }
  | { type: 'SET_CHEFS'; payload: Chef[] }
  | { type: 'UPDATE_CHEF'; payload: Chef }
  | { type: 'SET_DISHES'; payload: Dish[] }
  | { type: 'SET_INGREDIENTS'; payload: Ingredient[] }
  | { type: 'UPDATE_INGREDIENT_PRICE'; payload: { ingredientId: number; newPrice: number } }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_PLAYER'; payload: Partial<Player> }
  | { type: 'UPDATE_RESTAURANT'; payload: Partial<Restaurant> }
  | { type: 'LOGOUT' }

const initialState: GameState = {
  player: null,
  restaurant: null,
  chefs: [],
  dishes: [],
  ingredients: [],
  isAuthenticated: false,
  isLoading: true,
  notifications: [],
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, player: action.payload }
    case 'SET_RESTAURANT':
      return { ...state, restaurant: action.payload }
    case 'SET_CHEFS':
      return { ...state, chefs: action.payload }
    case 'UPDATE_CHEF':
      return {
        ...state,
        chefs: state.chefs.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }
    case 'SET_DISHES':
      return { ...state, dishes: action.payload }
    case 'SET_INGREDIENTS':
      return { ...state, ingredients: action.payload }
    case 'UPDATE_INGREDIENT_PRICE':
      return {
        ...state,
        ingredients: state.ingredients.map((ing) =>
          ing.id === action.payload.ingredientId
            ? { ...ing, current_price: action.payload.newPrice }
            : ing
        ),
      }
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] }
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) }
    case 'UPDATE_PLAYER':
      return state.player ? { ...state, player: { ...state.player, ...action.payload } } : state
    case 'UPDATE_RESTAURANT':
      return state.restaurant
        ? { ...state, restaurant: { ...state.restaurant, ...action.payload } }
        : state
    case 'LOGOUT':
      return { ...initialState, isLoading: false }
    default:
      return state
  }
}

interface GameContextType extends GameState {
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, restaurantName: string, cuisineType: string, decorStyle: string) => Promise<void>
  logout: () => Promise<void>
  loadGameData: () => Promise<void>
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  removeNotification: (id: string) => void
  refreshRestaurant: () => Promise<void>
  refreshChefs: () => Promise<void>
  refreshDishes: () => Promise<void>
  refreshIngredients: () => Promise<void>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const addNotification = useCallback(
    (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const id = Date.now().toString()
      dispatch({ type: 'ADD_NOTIFICATION', payload: { id, message, type } })
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
      }, 5000)
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }, [])

  const loadGameData = useCallback(async () => {
    try {
      const data = await authApi.getCurrentPlayer()
      dispatch({ type: 'SET_PLAYER', payload: data.player })
      dispatch({ type: 'SET_RESTAURANT', payload: data.restaurant })
      dispatch({ type: 'SET_CHEFS', payload: data.chefs || [] })
      dispatch({ type: 'SET_DISHES', payload: data.dishes || [] })
      const ingResult = await marketApi.listIngredients()
      dispatch({ type: 'SET_INGREDIENTS', payload: ingResult.ingredients || [] })
      dispatch({ type: 'SET_AUTHENTICATED', payload: true })
    } catch {
      dispatch({ type: 'SET_AUTHENTICATED', payload: false })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const refreshRestaurant = useCallback(async () => {
    if (!state.restaurant) return
    try {
      const result = await restaurantApi.get(state.restaurant.id)
      dispatch({ type: 'SET_RESTAURANT', payload: result.restaurant })
    } catch (e) {
      console.error('刷新餐厅数据失败:', e)
    }
  }, [state.restaurant])

  const refreshChefs = useCallback(async () => {
    if (!state.restaurant) return
    try {
      const result = await chefApi.listByRestaurant(state.restaurant.id)
      dispatch({ type: 'SET_CHEFS', payload: result.chefs || [] })
    } catch (e) {
      console.error('刷新厨师数据失败:', e)
    }
  }, [state.restaurant])

  const refreshDishes = useCallback(async () => {
    if (!state.restaurant) return
    try {
      const result = await dishApi.listByRestaurant(state.restaurant.id)
      dispatch({ type: 'SET_DISHES', payload: result.dishes || [] })
    } catch (e) {
      console.error('刷新菜品数据失败:', e)
    }
  }, [state.restaurant])

  const refreshIngredients = useCallback(async () => {
    try {
      const result = await marketApi.listIngredients()
      dispatch({ type: 'SET_INGREDIENTS', payload: result.ingredients || [] })
    } catch (e) {
      console.error('刷新食材数据失败:', e)
    }
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await authApi.login({ username, password })
        localStorage.setItem('token', response.token)
        localStorage.setItem('player', JSON.stringify(response.player))
        dispatch({ type: 'SET_PLAYER', payload: response.player })
        dispatch({ type: 'SET_RESTAURANT', payload: response.restaurant })
        dispatch({ type: 'SET_CHEFS', payload: response.chefs || [] })
        dispatch({ type: 'SET_DISHES', payload: response.dishes || [] })
        dispatch({ type: 'SET_AUTHENTICATED', payload: true })
        gameSocket.connect()
        addNotification('登录成功', 'success')
        await loadGameData()
      } catch (e: any) {
        addNotification(e?.error || e?.message || '登录失败', 'error')
        throw e
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [addNotification, loadGameData]
  )

  const register = useCallback(
    async (username: string, email: string, password: string, restaurantName: string, cuisineType: string, decorStyle: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await authApi.register({ username, email, password, restaurant_name: restaurantName, cuisine_type: cuisineType, decor_style: decorStyle })
        localStorage.setItem('token', response.token)
        localStorage.setItem('player', JSON.stringify(response.player))
        dispatch({ type: 'SET_PLAYER', payload: response.player })
        dispatch({ type: 'SET_RESTAURANT', payload: response.restaurant })
        dispatch({ type: 'SET_CHEFS', payload: response.chefs || [] })
        dispatch({ type: 'SET_DISHES', payload: response.dishes || [] })
        dispatch({ type: 'SET_AUTHENTICATED', payload: true })
        gameSocket.connect()
        addNotification('注册成功', 'success')
        await loadGameData()
      } catch (e: any) {
        addNotification(e?.error || e?.message || '注册失败', 'error')
        throw e
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [addNotification, loadGameData]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('player')
    gameSocket.disconnect()
    dispatch({ type: 'LOGOUT' })
    addNotification('已退出登录', 'info')
  }, [addNotification])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      gameSocket.connect()
      loadGameData()
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }

    return () => {
      gameSocket.disconnect()
    }
  }, [loadGameData])

  useEffect(() => {
    if (!state.isAuthenticated) return

    const unsubMarket = gameSocket.on('market:update', ({ type, data }) => {
      if (type === 'price_update') {
        addNotification('市场价格已更新', 'info')
        refreshIngredients()
      } else if (type === 'seasonal_event') {
        addNotification(`季节性事件：${data?.event?.name || '市场波动'}`, 'warning')
        refreshIngredients()
      }
    })

    const unsubNotif = gameSocket.on('notification', ({ message, type }) => {
      addNotification(message, type)
    })

    const unsubPromo = gameSocket.on('chef:promotionRequest', ({ chefName }) => {
      addNotification(`厨师 ${chefName} 申请晋升`, 'warning')
      refreshChefs()
    })

    const unsubRest = gameSocket.on('restaurant:update', ({ type, data }) => {
      addNotification(`餐厅数据已更新`, 'info')
      refreshRestaurant()
    })

    const unsubComp = gameSocket.on('competition:update', ({ type, data }) => {
      addNotification(`比赛状态更新`, 'info')
    })

    const unsubDuel = gameSocket.on('duel:update', ({ type, data }) => {
      addNotification(`厨艺对决状态更新`, 'info')
    })

    return () => {
      unsubMarket()
      unsubNotif()
      unsubPromo()
      unsubRest()
      unsubComp()
      unsubDuel()
    }
  }, [state.isAuthenticated, addNotification, refreshChefs, refreshRestaurant, refreshIngredients])

  const value: GameContextType = {
    ...state,
    login,
    register,
    logout,
    loadGameData,
    addNotification,
    removeNotification,
    refreshRestaurant,
    refreshChefs,
    refreshDishes,
    refreshIngredients,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
