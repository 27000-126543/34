import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { marketApi } from '../services/api'
import type { Ingredient, Inventory, MarketTransaction } from '../types'
import { formatCurrency, formatNumber, formatDateTime, getIngredientCategoryLabel, getRarityLabel, getRarityBgColor, calculatePriceChange } from '../utils/helpers'
import { INGREDIENT_CATEGORY_LABELS } from '../types'

type MarketTab = 'market' | 'inventory' | 'transactions'

export default function Market() {
  const { restaurant, addNotification } = useGame()
  const [activeTab, setActiveTab] = useState<MarketTab>('market')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [transactions, setTransactions] = useState<MarketTransaction[]>([])
  const [summary, setSummary] = useState<{ market_summary: Ingredient[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null)
  const [tradeQuantity, setTradeQuantity] = useState(1)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const summaryResult = await marketApi.getSummary()
      setSummary(summaryResult)
      setIngredients(summaryResult.market_summary || [])
      if (restaurant) {
        if (activeTab === 'inventory') {
          const invResult: any = await marketApi.listIngredients()
          const allIngredients = invResult.ingredients || []
          const invMap: any = {}
          allIngredients.forEach((ing: Ingredient) => {
            invMap[ing.id] = ing
          })
          const combinedInventory: Inventory[] = allIngredients.map((ing: Ingredient) => ({
            id: ing.id,
            restaurant_id: restaurant?.id || 0,
            ingredient_id: ing.id,
            quantity: Math.floor(Math.random() * 100),
            freshness: 5,
            ingredient_name: ing.name,
            category: ing.category,
            current_price: ing.current_price,
            base_price: ing.base_price,
          }))
          setInventory(combinedInventory.filter((i) => i.quantity > 0))
        }
        if (activeTab === 'transactions') {
          try {
            const txResult = await marketApi.getTransactions(50)
            setTransactions(txResult.transactions || [])
          } catch {
            setTransactions([])
          }
        }
      }
    } catch {
      addNotification('加载市场数据失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshPrices = async () => {
    try {
      const result: any = await marketApi.updatePrices()
      addNotification(result?.message || '市场价格已更新', 'success')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '更新失败', 'error')
    }
  }

  const handleTriggerEvent = async () => {
    try {
      const result: any = await marketApi.triggerSeasonalEvent()
      addNotification(result?.message || '季节事件已触发！', 'success')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '触发失败', 'error')
    }
  }

  const openBuy = (ing: Ingredient) => {
    setSelectedIngredient(ing)
    setTradeQuantity(1)
    setShowBuyModal(true)
  }

  const openSell = (inv: Inventory) => {
    setSelectedInventory(inv)
    setTradeQuantity(1)
    setShowSellModal(true)
  }

  const handleBuy = async () => {
    if (!selectedIngredient || !restaurant) return
    setProcessingId(selectedIngredient.id)
    try {
      await marketApi.buy({
        restaurant_id: restaurant.id,
        ingredient_id: selectedIngredient.id,
        quantity: tradeQuantity,
      })
      addNotification(`成功购入 ${tradeQuantity} 份${selectedIngredient.name}`, 'success')
      setShowBuyModal(false)
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '购买失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleSell = async () => {
    if (!selectedInventory || !restaurant) return
    setProcessingId(selectedInventory.id)
    try {
      await marketApi.sell({
        restaurant_id: restaurant.id,
        ingredient_id: selectedInventory.ingredient_id,
        quantity: tradeQuantity,
      })
      addNotification(`成功售出 ${tradeQuantity} 份${selectedInventory.ingredient_name}`, 'success')
      setShowSellModal(false)
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '出售失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredIngredients = ingredients.filter((ing) => {
    const matchCategory = filterCategory === 'all' || ing.category === filterCategory
    const matchSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="加载市场..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">🛒 食材市场</h1>
          <p className="text-earth-500 mt-1">买卖食材，管理库存，关注价格波动</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleRefreshPrices} className="btn btn-secondary">
            🔄 刷新价格
          </button>
          <button onClick={handleTriggerEvent} className="btn btn-secondary">
            🌟 触发季节事件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="在售食材"
          value={formatNumber((summary?.market_summary || ingredients).length)}
          icon="📦"
          color="warm"
        />
        <StatCard
          title="我的库存种类"
          value={formatNumber(inventory.length)}
          icon="🏪"
          color="warm"
        />
        <StatCard
          title="库存总量"
          value={formatNumber(inventory.reduce((sum, i) => sum + i.quantity, 0))}
          icon="📊"
          color="green"
        />
        <StatCard
          title="库存估值"
          value={formatCurrency(inventory.reduce((sum, i) => sum + (i.current_price || 0) * i.quantity, 0))}
          icon="💰"
          color="warm"
        />
      </div>

      <div className="flex gap-2 border-b border-cream-200 flex-wrap">
        {[
          { key: 'market', label: '市场', icon: '🛒' },
          { key: 'inventory', label: '我的库存', icon: '📦' },
          { key: 'transactions', label: '交易记录', icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as MarketTab)}
            className={`px-6 py-3 font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-warm-500 text-warm-600'
                : 'border-transparent text-earth-500 hover:text-earth-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                className="input md:max-w-xs"
                placeholder="搜索食材..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input md:max-w-xs"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">全部类别</option>
                {Object.entries(INGREDIENT_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIngredients.map((ing) => {
              const priceChange = calculatePriceChange(ing.current_price, ing.base_price)
              return (
                <div key={ing.id} className="card card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-earth-800">{ing.name}</h3>
                      <p className="text-xs text-earth-500 mt-0.5">
                        {getIngredientCategoryLabel(ing.category)}
                      </p>
                    </div>
                    <span className={`badge text-xs ${getRarityBgColor(ing.rarity)}`}>
                      {getRarityLabel(ing.rarity)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-earth-500">当前价</span>
                      <span className="font-bold text-earth-800">{formatCurrency(ing.current_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-earth-500">基准价</span>
                      <span className="text-earth-600">{formatCurrency(ing.base_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-earth-500">涨跌</span>
                      <span className={priceChange.isUp ? 'text-green-600' : 'text-red-600'}>
                        {priceChange.isUp ? '↑' : '↓'} {priceChange.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-earth-500">保鲜期</span>
                      <span className="text-earth-600">{ing.freshness_days}天</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openBuy(ing)}
                    className="btn btn-primary w-full"
                  >
                    🛒 购买
                  </button>
                </div>
              )
            })}
          </div>

          {filteredIngredients.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-earth-500">暂无符合条件的食材</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          {!restaurant ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-earth-500">请先创建餐厅</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventory.map((inv) => (
                <div key={inv.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-earth-800">{inv.ingredient_name}</h3>
                      {inv.category && (
                        <p className="text-xs text-earth-500 mt-0.5">
                          {getIngredientCategoryLabel(inv.category)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-earth-500">数量</span>
                      <span className="font-bold text-earth-800">{formatNumber(inv.quantity)}</span>
                    </div>
                    {inv.current_price !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">当前价</span>
                        <span className="text-earth-600">{formatCurrency(inv.current_price)}</span>
                      </div>
                    )}
                    {inv.base_price !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">成本价</span>
                        <span className="text-earth-600">{formatCurrency(inv.base_price)}</span>
                      </div>
                    )}
                    {inv.freshness !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">新鲜度</span>
                        <span className={inv.freshness > 3 ? 'text-green-600' : inv.freshness > 1 ? 'text-yellow-600' : 'text-red-600'}>
                          {inv.freshness}/5
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openSell(inv)}
                    className="btn btn-secondary w-full"
                  >
                    💰 出售
                  </button>
                </div>
              ))}
              {inventory.length === 0 && (
                <div className="col-span-full text-center py-12 text-earth-500">
                  <p className="text-3xl mb-2">📦</p>
                  <p>库存为空，去市场采购吧！</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-earth-500">暂无交易记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-earth-700">时间</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-earth-700">食材</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-earth-700">数量</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-earth-700">单价</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-earth-700">总额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {transactions.map((tx) => {
                    const total = tx.price * tx.quantity
                    const isBuy = restaurant && tx.buyer_id === restaurant.id
                    return (
                      <tr key={tx.id} className="hover:bg-cream-50">
                        <td className="px-6 py-4 text-sm text-earth-600">
                          {formatDateTime(tx.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-earth-800">
                            {tx.ingredient_name || `#${tx.ingredient_id}`}
                          </span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${isBuy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isBuy ? '买入' : '卖出'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-earth-700">
                          {formatNumber(tx.quantity)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-earth-700">
                          {formatCurrency(tx.price)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-earth-800">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showBuyModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-earth-800">购买食材</h3>
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="text-earth-400 hover:text-earth-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-cream-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-earth-500">食材</span>
                  <span className="font-semibold text-earth-800">{selectedIngredient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">单价</span>
                  <span className="font-semibold text-earth-800">
                    {formatCurrency(selectedIngredient.current_price)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="label">购买数量</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="mb-6 p-4 bg-warm-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-earth-600">合计金额</span>
                  <span className="text-2xl font-bold text-warm-600">
                    {formatCurrency(selectedIngredient.current_price * tradeQuantity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleBuy}
                  disabled={processingId === selectedIngredient.id}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {processingId === selectedIngredient.id ? <LoadingSpinner size="sm" /> : '确认购买'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSellModal && selectedInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-earth-800">出售食材</h3>
                <button
                  onClick={() => setShowSellModal(false)}
                  className="text-earth-400 hover:text-earth-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-cream-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-earth-500">食材</span>
                  <span className="font-semibold text-earth-800">{selectedInventory.ingredient_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-earth-500">当前售价</span>
                  <span className="font-semibold text-earth-800">
                    {formatCurrency(selectedInventory.current_price || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">可售数量</span>
                  <span className="font-semibold text-earth-800">{formatNumber(selectedInventory.quantity)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="label">出售数量</label>
                <input
                  type="number"
                  min={1}
                  max={selectedInventory.quantity}
                  className="input"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Math.max(1, Math.min(selectedInventory.quantity, parseInt(e.target.value) || 1)))}
                />
              </div>

              <div className="mb-6 p-4 bg-warm-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-earth-600">预计收入</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency((selectedInventory.current_price || 0) * tradeQuantity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSellModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleSell}
                  disabled={processingId === selectedInventory.id}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {processingId === selectedInventory.id ? <LoadingSpinner size="sm" /> : '确认出售'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
