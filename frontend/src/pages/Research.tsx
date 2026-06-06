import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { dishApi, marketApi, restaurantApi } from '../services/api'
import type { Recipe, ChefEquipment, Ingredient, Inventory, Chef } from '../types'
import { formatNumber, getRarityLabel, getRarityBgColor, formatCurrency, getCuisineLabel, getIngredientCategoryLabel } from '../utils/helpers'

export default function Research() {
  const { player, restaurant, chefs, addNotification, refreshDishes, refreshIngredients, refreshRestaurant } = useGame()
  const [activeTab, setActiveTab] = useState<'recipes' | 'discover' | 'equipment'>('recipes')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [equipment, setEquipment] = useState<ChefEquipment[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIngredients, setSelectedIngredients] = useState<{ ingredient_id: number; quantity: number }[]>([])
  const [unlockingRecipe, setUnlockingRecipe] = useState<number | null>(null)
  const [developing, setDeveloping] = useState(false)
  const [selectedChef, setSelectedChef] = useState<number | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [r, e, ingResult] = await Promise.all([
        dishApi.listRecipes(),
        dishApi.listEquipment(),
        marketApi.listIngredients(),
      ])
      setRecipes(r.recipes || [])
      setEquipment(e.equipment || [])
      setIngredients(ingResult.ingredients || [])
      if (restaurant) {
        const invResult = await restaurantApi.getInventory(restaurant.id)
        setInventory(invResult.inventory || [])
      }
    } catch {
      addNotification('加载数据失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlockRecipe = async (recipeId: number) => {
    setUnlockingRecipe(recipeId)
    try {
      await dishApi.unlockRecipe({ recipe_id: recipeId })
      addNotification('菜谱解锁成功！', 'success')
      await loadData()
      await refreshDishes()
    } catch {
      addNotification('解锁失败', 'error')
    } finally {
      setUnlockingRecipe(null)
    }
  }

  const handleDevelop = async () => {
    if (!restaurant || !selectedChef || !selectedRecipe) {
      addNotification('请选择菜谱和厨师', 'warning')
      return
    }
    setDeveloping(true)
    try {
      const result = await dishApi.develop({
        restaurant_id: restaurant.id,
        recipe_id: selectedRecipe,
        chef_id: selectedChef,
      })
      if (result && result.dish) {
        addNotification(`研发成功：${result.dish.name}！`, 'success')
        setSelectedRecipe(null)
        setSelectedChef(null)
      } else {
        addNotification('研发完成！', 'success')
      }
      await loadData()
      await refreshDishes()
    } catch (e: any) {
      addNotification(e?.message || '研发失败', 'error')
    } finally {
      setDeveloping(false)
    }
  }

  const addIngredient = (ingredient_id: number) => {
    const inv = inventory.find((i) => i.ingredient_id === ingredient_id)
    const existing = selectedIngredients.find((s) => s.ingredient_id === ingredient_id)
    const maxQty = inv?.quantity || 10

    if (existing) {
      if (existing.quantity < maxQty) {
        setSelectedIngredients((prev) =>
          prev.map((s) => (s.ingredient_id === ingredient_id ? { ...s, quantity: s.quantity + 1 } : s))
        )
      }
    } else {
      setSelectedIngredients((prev) => [...prev, { ingredient_id, quantity: 1 }])
    }
  }

  const removeIngredient = (ingredient_id: number) => {
    setSelectedIngredients((prev) => prev.filter((s) => s.ingredient_id !== ingredient_id))
  }

  const updateQuantity = (ingredient_id: number, qty: number) => {
    if (qty < 1) {
      removeIngredient(ingredient_id)
      return
    }
    setSelectedIngredients((prev) =>
      prev.map((s) => (s.ingredient_id === ingredient_id ? { ...s, quantity: qty } : s))
    )
  }

  const handleDiscover = async () => {
    if (!restaurant || !selectedChef) {
      addNotification('请选择厨师', 'warning')
      return
    }
    if (selectedIngredients.length < 2) {
      addNotification('请至少选择2种食材', 'warning')
      return
    }
    setDeveloping(true)
    try {
      const result = await dishApi.develop({
        restaurant_id: restaurant.id,
        recipe_id: 0,
        chef_id: selectedChef,
      })
      if (result && result.dish) {
        addNotification(`发现新菜谱：${result.dish.name}！`, 'success')
        setSelectedIngredients([])
      } else {
        addNotification('本次合成没有发现新菜谱，继续尝试吧！', 'warning')
      }
      await loadData()
      await refreshDishes()
    } catch (e: any) {
      addNotification(e?.message || '合成失败', 'error')
    } finally {
      setDeveloping(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="加载研发中心..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">菜品研发中心</h1>
          <p className="text-earth-500 mt-1">研究新菜品，合成稀有装备</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <span>🔬</span>
          <span className="font-semibold text-blue-700">
            研究点：{formatNumber(player?.research_points || 0)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-cream-200">
        {[
          { key: 'recipes', label: '菜谱图鉴', icon: '📖' },
          { key: 'discover', label: '菜品研发', icon: '⚗️' },
          { key: 'equipment', label: '装备锻造', icon: '⚒️' },
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

      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`card card-hover ${!recipe.is_unlockable ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-earth-800 text-lg">
                    {recipe.name}
                  </h3>
                  <p className="text-sm text-earth-500 mt-1">
                    {getCuisineLabel(recipe.cuisine_type)} · 难度：{'⭐'.repeat(recipe.difficulty)}
                  </p>
                </div>
                <span className={`badge ${getRarityBgColor(recipe.rarity)}`}>{getRarityLabel(recipe.rarity)}</span>
              </div>

              <p className="text-sm text-earth-600 mb-3 min-h-[40px]">
                美味的{getCuisineLabel(recipe.cuisine_type)}菜品
              </p>

              <div className="mb-3">
                <p className="text-xs text-earth-500 mb-1">所需食材：</p>
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients_json.map((ing, i) => {
                    const ingredient = ingredients.find((x) => x.id === ing.ingredient_id)
                    return (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-full bg-cream-100 text-earth-600"
                      >
                        {ingredient?.name || '未知'} x{ing.quantity}
                      </span>
                    )
                  })}
                </div>
              </div>

              {recipe.is_unlockable ? (
                <button
                  onClick={() => handleUnlockRecipe(recipe.id)}
                  disabled={unlockingRecipe === recipe.id || (player?.research_points || 0) < recipe.cost_points}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  {unlockingRecipe === recipe.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>解锁（{recipe.cost_points} 研究点）</>
                  )}
                </button>
              ) : (
                <span className="badge badge-success w-full justify-center py-1.5">已解锁</span>
              )}
            </div>
          ))}
          {recipes.length === 0 && (
            <div className="col-span-full text-center py-12 text-earth-500">
              <p className="text-4xl mb-3">📖</p>
              <p>暂无菜谱数据</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">研发新菜品</h3>
            <p className="text-sm text-earth-500 mb-4">
              选择菜谱和厨师进行菜品研发，或选择食材合成发现全新菜谱！
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">选择菜谱</label>
                <select
                  className="input"
                  value={selectedRecipe || ''}
                  onChange={(e) => setSelectedRecipe(Number(e.target.value) || null)}
                >
                  <option value="">选择菜谱（可选）</option>
                  {recipes.filter(r => r.is_unlockable).map((r) => (
                    <option key={r.id} value={r.id}>{r.name} - {getCuisineLabel(r.cuisine_type)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">选择厨师</label>
                <select
                  className="input"
                  value={selectedChef || ''}
                  onChange={(e) => setSelectedChef(Number(e.target.value) || null)}
                >
                  <option value="">选择负责厨师</option>
                  {chefs.map((c: Chef) => (
                    <option key={c.id} value={c.id}>{c.name} - 技能 {c.skill}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-earth-700 mb-2">已选食材（用于发现新菜谱）：</p>
                {selectedIngredients.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-cream-300 rounded-lg text-center text-earth-400">
                    从下方选择食材（可选）
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedIngredients.map((sel) => {
                      const ing = ingredients.find((i) => i.id === sel.ingredient_id)
                      return (
                        <div key={sel.ingredient_id} className="flex items-center justify-between p-3 bg-cream-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-earth-800">{ing?.name}</p>
                              <p className="text-xs text-earth-500">{ing ? getIngredientCategoryLabel(ing.category) : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(sel.ingredient_id, sel.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-cream-200 text-earth-600 hover:bg-cream-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold">{sel.quantity}</span>
                            <button
                              onClick={() => addIngredient(sel.ingredient_id)}
                              className="w-8 h-8 rounded-full bg-cream-200 text-earth-600 hover:bg-cream-300"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeIngredient(sel.ingredient_id)}
                              className="ml-2 text-red-500 hover:text-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleDevelop}
                disabled={developing || (!selectedRecipe && selectedIngredients.length < 2) || !selectedChef}
                className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
              >
                {developing ? <LoadingSpinner size="sm" /> : '⚗️ 开始研发'}
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">可用食材</h3>
            <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
              {inventory.map((inv) => {
                const ing = ingredients.find((i) => i.id === inv.ingredient_id)
                if (!ing) return null
                const isSelected = selectedIngredients.some((s) => s.ingredient_id === inv.ingredient_id)
                return (
                  <button
                    key={inv.ingredient_id}
                    onClick={() => addIngredient(inv.ingredient_id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-warm-400 bg-warm-50'
                        : 'border-cream-200 hover:border-cream-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-earth-800 truncate">{inv.ingredient_name || ing.name}</p>
                        <p className="text-xs text-earth-500">库存：{inv.quantity}</p>
                      </div>
                    </div>
                    <span className={`badge ${getRarityBgColor(ing.rarity)}`}>{getRarityLabel(ing.rarity)}</span>
                  </button>
                )
              })}
              {inventory.length === 0 && (
                <div className="col-span-2 text-center py-8 text-earth-500">
                  <p className="text-3xl mb-2">🛒</p>
                  <p>库存为空，请前往市场采购食材</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <div key={eq.id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl border-2 ${getRarityBgColor(eq.rarity)}`}>
                    {eq.type === 'knife' ? '🔪' : eq.type === 'pan' ? '🍳' : eq.type === 'utensil' ? '🥄' : '🎨'}
                  </div>
                  <div>
                    <h3 className="font-bold text-earth-800">{eq.name}</h3>
                    <p className="text-sm text-earth-500">
                      {eq.type === 'knife' ? '刀具' : eq.type === 'pan' ? '锅具' : eq.type === 'utensil' ? '器具' : '装饰'}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getRarityBgColor(eq.rarity)}`}>{getRarityLabel(eq.rarity)}</span>
              </div>

              <p className="text-sm text-earth-600 mb-3">精良的厨师装备，提升厨师技能</p>

              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-earth-500">技能加成</span>
                  <span className="font-semibold text-warm-600">+{eq.bonus_skill}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-cream-100">
                <button
                  disabled={(player?.research_points || 0) < eq.cost_points}
                  className="btn btn-secondary w-full disabled:opacity-50"
                >
                  锻造（{eq.cost_points} 研究点）
                </button>
              </div>
            </div>
          ))}
          {equipment.length === 0 && (
            <div className="col-span-full text-center py-12 text-earth-500">
              <p className="text-4xl mb-3">⚒️</p>
              <p>暂无装备数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
