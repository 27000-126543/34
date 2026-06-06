import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import StatCard from '../components/StatCard'
import RatingStars from '../components/RatingStars'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency, formatNumber, getCuisineLabel, getDecorLabel, getRarityLabel, getRarityBgColor } from '../utils/helpers'
import { restaurantApi, dishApi } from '../services/api'
import type { Dish, Inventory } from '../types'
import { CUISINE_LABELS, DECOR_LABELS } from '../types'

export default function Restaurant() {
  const { restaurant, dishes, chefs, addNotification, refreshRestaurant, refreshDishes } = useGame()
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'decor' | 'inventory'>('overview')
  const [menu, setMenu] = useState<Dish[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedDecor, setSelectedDecor] = useState('')

  useEffect(() => {
    if (activeTab === 'menu' && dishes.length === 0) {
      loadMenu()
    }
    if (activeTab === 'inventory') {
      loadInventory()
    }
  }, [activeTab])

  const loadMenu = async () => {
    setIsLoading(true)
    try {
      if (restaurant) {
        const result = await dishApi.listByRestaurant(restaurant.id)
        setMenu(result.dishes || [])
      }
    } catch {
      addNotification('加载菜单失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadInventory = async () => {
    if (!restaurant) return
    setIsLoading(true)
    try {
      const result = await restaurantApi.getInventory(restaurant.id)
      setInventory(result.inventory || [])
    } catch {
      addNotification('加载库存失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!restaurant) {
    return <LoadingSpinner label="加载餐厅数据..." />
  }

  const handleUpgradeDecoration = async () => {
    try {
      const result = await restaurantApi.update(restaurant.id, { level: restaurant.level + 1 })
      await refreshRestaurant()
      addNotification('装潢升级成功！', 'success')
      setShowUpgradeModal(false)
    } catch {
      addNotification('装潢升级失败', 'error')
    }
  }

  const handleChangeCuisine = async () => {
    if (!selectedCuisine) return
    try {
      await restaurantApi.update(restaurant.id, { cuisine_type: selectedCuisine as any })
      await refreshRestaurant()
      addNotification(`已切换为${getCuisineLabel(selectedCuisine)}菜系`, 'success')
      setSelectedCuisine('')
    } catch {
      addNotification('切换菜系失败', 'error')
    }
  }

  const handleChangeDecor = async () => {
    if (!selectedDecor) return
    try {
      await restaurantApi.update(restaurant.id, { decor_style: selectedDecor as any })
      await refreshRestaurant()
      addNotification(`已切换为${getDecorLabel(selectedDecor)}风格`, 'success')
      setSelectedDecor('')
    } catch {
      addNotification('切换风格失败', 'error')
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    try {
      await restaurantApi.update(restaurant.id, { name: newName.trim() })
      await refreshRestaurant()
      addNotification('餐厅名称已更新', 'success')
      setEditingName(false)
    } catch {
      addNotification('更新失败', 'error')
    }
  }

  const handleRefreshRating = async () => {
    try {
      const result = await restaurantApi.refreshRating(restaurant.id)
      await refreshRestaurant()
      addNotification(`评分刷新完成：${result.new_rating.toFixed(1)}分`, 'success')
    } catch {
      addNotification('刷新评分失败', 'error')
    }
  }

  const upgradeCost = restaurant.level * 50000
  const displayMenu = menu.length > 0 ? menu : dishes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center text-3xl">
            🏪
          </div>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="input w-64"
                  defaultValue={restaurant.name}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <button onClick={handleUpdateName} className="btn btn-primary btn-sm">保存</button>
                <button onClick={() => setEditingName(false)} className="btn btn-secondary btn-sm">取消</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-earth-800">{restaurant.name}</h1>
                <button
                  onClick={() => {
                    setNewName(restaurant.name)
                    setEditingName(true)
                  }}
                  className="text-earth-400 hover:text-warm-500"
                >
                  ✏️
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-earth-500">{getCuisineLabel(restaurant.cuisine_type)}菜系</span>
              <RatingStars rating={restaurant.avg_rating} />
            </div>
          </div>
        </div>
        <button onClick={handleRefreshRating} className="btn btn-secondary">
          🔄 刷新评分
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="累计营收" value={formatCurrency(restaurant.total_profit)} icon="💰" color="green" />
        <StatCard title="平均评分" value={restaurant.avg_rating.toFixed(1)} icon="⭐" suffix=" 分" color="warm" />
        <StatCard title="餐厅等级" value={`Lv.${restaurant.level}`} icon="🎨" color="blue" />
        <StatCard title="厨师数量" value={chefs.length} icon="👨‍🍳" color="purple" />
      </div>

      <div className="flex gap-2 border-b border-cream-200">
        {[
          { key: 'overview', label: '餐厅概览', icon: '📊' },
          { key: 'menu', label: '菜单管理', icon: '📋' },
          { key: 'inventory', label: '食材库存', icon: '📦' },
          { key: 'decor', label: '装潢升级', icon: '🎨' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
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

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">餐厅信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-cream-100">
                <span className="text-earth-500">餐厅名称</span>
                <span className="text-earth-800 font-medium">{restaurant.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cream-100">
                <span className="text-earth-500">菜系类型</span>
                <span className="text-earth-800 font-medium">{getCuisineLabel(restaurant.cuisine_type)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cream-100">
                <span className="text-earth-500">装潢风格</span>
                <span className="text-earth-800 font-medium">{getDecorLabel(restaurant.decor_style)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cream-100">
                <span className="text-earth-500">餐厅等级</span>
                <span className="text-earth-800 font-medium">Lv.{restaurant.level}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cream-100">
                <span className="text-earth-500">菜单数量</span>
                <span className="text-earth-800 font-medium">{displayMenu.length} 道</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-earth-500">厨师数量</span>
                <span className="text-earth-800 font-medium">{chefs.length} 位</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <h4 className="font-semibold text-earth-700 mb-3">切换菜系</h4>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {Object.entries(CUISINE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCuisine(key)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCuisine === key
                          ? 'bg-warm-500 text-white'
                          : restaurant.cuisine_type === key
                            ? 'bg-warm-100 text-warm-700'
                            : 'bg-cream-100 text-earth-600 hover:bg-cream-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleChangeCuisine}
                  disabled={!selectedCuisine || selectedCuisine === restaurant.cuisine_type}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  确认切换
                </button>
              </div>
              <div>
                <h4 className="font-semibold text-earth-700 mb-3">切换装潢</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {Object.entries(DECOR_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDecor(key)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedDecor === key
                          ? 'bg-warm-500 text-white'
                          : restaurant.decor_style === key
                            ? 'bg-warm-100 text-warm-700'
                            : 'bg-cream-100 text-earth-600 hover:bg-cream-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleChangeDecor}
                  disabled={!selectedDecor || selectedDecor === restaurant.decor_style}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  确认切换
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">餐厅评分</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-earth-600">综合评分</span>
                  <span className="font-bold text-warm-600">{restaurant.avg_rating.toFixed(1)}</span>
                </div>
                <div className="w-full h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warm-400 to-warm-600"
                    style={{ width: `${(restaurant.avg_rating / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-earth-600">累计营收</span>
                  <span className="font-bold text-green-600">{formatCurrency(restaurant.total_profit)}</span>
                </div>
                <div className="w-full h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600"
                    style={{ width: `${Math.min(100, restaurant.total_profit / 100000)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-warm-50 to-cream-50 rounded-xl">
              <h4 className="font-semibold text-earth-800 mb-2">💡 经营建议</h4>
              <ul className="text-sm text-earth-600 space-y-1">
                <li>• 提升厨师技能可提高菜品评分</li>
                <li>• 升级装潢等级提升餐厅等级</li>
                <li>• 研发新菜品丰富菜单选择</li>
                <li>• 参加美食大赛提升餐厅声望</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-earth-800">菜单管理</h3>
            <span className="text-sm text-earth-500">共 {displayMenu.length} 道菜</span>
          </div>
          {isLoading ? (
            <LoadingSpinner label="加载菜单..." />
          ) : displayMenu.length === 0 ? (
            <div className="text-center py-12 text-earth-500">
              <p className="text-4xl mb-3">🍽️</p>
              <p>暂无菜品，请前往研发中心研发新菜品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayMenu.map((dish) => (
                <div key={dish.id} className="border border-cream-200 rounded-xl p-4 hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-earth-800">{dish.name}</h4>
                      <p className="text-xs text-earth-500">{getCuisineLabel(dish.cuisine_type)}</p>
                    </div>
                    <span className={`badge ${dish.is_rare ? 'badge-warning' : 'badge-success'}`}>
                      {dish.is_rare ? '稀有' : '普通'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-3">
                    <div>
                      <span className="text-earth-500">售价：</span>
                      <span className="font-semibold text-warm-600">{formatCurrency(dish.base_price)}</span>
                    </div>
                    <RatingStars rating={dish.rating} size="sm" showValue={false} />
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs text-earth-500">
                    <span>已售 {dish.sales_count} 份</span>
                    {dish.is_rare && (
                      <span className={`px-2 py-0.5 rounded-full ${getRarityBgColor(5)}`}>
                        {getRarityLabel(4)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-earth-800">食材库存</h3>
            <button onClick={loadInventory} className="btn btn-secondary btn-sm">🔄 刷新</button>
          </div>
          {isLoading ? (
            <LoadingSpinner label="加载库存..." />
          ) : inventory.length === 0 ? (
            <div className="text-center py-12 text-earth-500">
              <p className="text-4xl mb-3">📦</p>
              <p>暂无库存，请前往市场采购食材</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>食材</th>
                    <th>分类</th>
                    <th>数量</th>
                    <th>新鲜度</th>
                    <th>当前价值</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-medium">{inv.ingredient_name || `食材 #${inv.ingredient_id}`}</td>
                      <td className="text-earth-500">{inv.category || '-'}</td>
                      <td>{inv.quantity}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-cream-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${Math.min(100, inv.freshness)}%` }}
                            />
                          </div>
                          <span className="text-xs text-earth-500">{inv.freshness}%</span>
                        </div>
                      </td>
                      <td className="font-semibold text-warm-600">
                        {inv.current_price ? formatCurrency(inv.current_price * inv.quantity) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'decor' && (
        <div className="card">
          <h3 className="text-lg font-bold text-earth-800 mb-6">装潢升级</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-cream-50 to-warm-50 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-earth-500">当前等级</p>
                    <p className="text-3xl font-bold text-warm-600">Lv.{restaurant.level}</p>
                  </div>
                  <span className="text-6xl">🏛️</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-600">装潢风格</span>
                    <span className="font-semibold text-earth-800">{getDecorLabel(restaurant.decor_style)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-600">累计营收</span>
                    <span className="font-semibold text-green-600">{formatCurrency(restaurant.total_profit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-600">平均评分</span>
                    <span className="font-semibold text-blue-600">{restaurant.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-2 border-dashed border-warm-300 rounded-2xl bg-warm-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-earth-500">下一等级</p>
                    <p className="text-3xl font-bold text-warm-600">Lv.{restaurant.level + 1}</p>
                  </div>
                  <span className="text-6xl opacity-60">✨</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-600">等级提升</span>
                    <span className="font-semibold text-green-600">Lv.{restaurant.level} → Lv.{restaurant.level + 1}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn btn-primary w-full py-3 text-lg"
                >
                  升级装潢（{formatCurrency(upgradeCost)}）
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-earth-700">装潢等级权益</h4>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <div
                  key={level}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    level <= restaurant.level
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-cream-50 border border-cream-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      level <= restaurant.level
                        ? 'bg-green-500 text-white'
                        : 'bg-cream-200 text-earth-500'
                    }`}
                  >
                    {level <= restaurant.level ? '✓' : level}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-earth-800">等级 {level}</p>
                    <p className="text-sm text-earth-500">
                      解锁更多菜品槽位 · 基础评分加成 +{level * 2}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showUpgradeModal}
        title="确认升级装潢"
        message={`升级到 Lv.${restaurant.level + 1} 需要消耗 ${formatCurrency(upgradeCost)}，确认升级吗？`}
        confirmText="确认升级"
        onConfirm={handleUpgradeDecoration}
        onCancel={() => setShowUpgradeModal(false)}
        type="warning"
      />
    </div>
  )
}
