import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import { RadarChart } from '../components/Chart'
import { chefApi } from '../services/api'
import type { Chef } from '../types'
import { formatNumber, getChefLevelLabel, getChefLevelBgColor, getChefExpForNextLevel } from '../utils/helpers'

export default function Chefs() {
  const { chefs, restaurant, addNotification, refreshChefs } = useGame()
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showHireModal, setShowHireModal] = useState(false)
  const [pendingPromotions, setPendingPromotions] = useState<Chef[]>([])
  const [newChef, setNewChef] = useState({ name: '' })
  const [fireConfirm, setFireConfirm] = useState<Chef | null>(null)

  useEffect(() => {
    if (restaurant) {
      loadPendingPromotions()
    }
  }, [restaurant])

  const loadPendingPromotions = async () => {
    if (!restaurant) return
    try {
      const result = await chefApi.getPending(restaurant.id)
      setPendingPromotions(result.pending_promotions || [])
    } catch {}
  }

  const handleHire = async () => {
    if (!newChef.name || !restaurant) {
      addNotification('请填写厨师姓名', 'warning')
      return
    }
    setIsLoading(true)
    try {
      await chefApi.hire({ restaurant_id: restaurant.id, name: newChef.name })
      await refreshChefs()
      addNotification('雇佣成功！', 'success')
      setShowHireModal(false)
      setNewChef({ name: '' })
    } catch {
      addNotification('雇佣失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFire = async (chef: Chef) => {
    try {
      await chefApi.fire(chef.id)
      await refreshChefs()
      addNotification(`已解雇 ${chef.name}`, 'info')
      setFireConfirm(null)
      setSelectedChef(null)
    } catch {
      addNotification('解雇失败', 'error')
    }
  }

  const handleApprovePromotion = async (chef: Chef) => {
    try {
      await chefApi.approvePromotion(chef.id)
      await refreshChefs()
      await loadPendingPromotions()
      addNotification(`${chef.name} 晋升成功！`, 'success')
    } catch {
      addNotification('审批失败', 'error')
    }
  }

  const handleRejectPromotion = async (chef: Chef) => {
    try {
      await chefApi.rejectPromotion(chef.id)
      await refreshChefs()
      await loadPendingPromotions()
      addNotification(`已拒绝 ${chef.name} 的晋升申请`, 'info')
    } catch {
      addNotification('操作失败', 'error')
    }
  }

  const avgSkill = chefs.length > 0 
    ? Math.round(chefs.reduce((sum, c) => sum + c.skill, 0) / chefs.length) 
    : 0

  const expProgress = (chef: Chef) => {
    const nextExp = getChefExpForNextLevel(chef.level)
    if (nextExp === Infinity) return 100
    return Math.min(100, (chef.exp / nextExp) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">厨师管理</h1>
          <p className="text-earth-500 mt-1">管理你的厨师团队，打造顶尖厨艺阵容</p>
        </div>
        <button onClick={() => setShowHireModal(true)} className="btn btn-primary">
          <span>➕</span> 雇佣新厨师
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card card-hover">
          <p className="text-sm text-earth-500 mb-1">厨师总数</p>
          <p className="text-2xl font-bold text-earth-800">{chefs.length}</p>
        </div>
        <div className="card card-hover">
          <p className="text-sm text-earth-500 mb-1">平均技能</p>
          <p className="text-2xl font-bold text-blue-600">{avgSkill}</p>
        </div>
        <div className="card card-hover">
          <p className="text-sm text-earth-500 mb-1">主厨数量</p>
          <p className="text-2xl font-bold text-warm-600">
            {chefs.filter(c => c.level === 'head_chef' || c.level === 'master').length}
          </p>
        </div>
        <div className="card card-hover">
          <p className="text-sm text-earth-500 mb-1">待晋升</p>
          <p className="text-2xl font-bold text-purple-600">{pendingPromotions.length}</p>
        </div>
      </div>

      {pendingPromotions.length > 0 && (
        <div className="card border-2 border-yellow-300 bg-yellow-50">
          <h3 className="font-bold text-earth-800 mb-3 flex items-center gap-2">
            <span>📋</span> 待审批晋升申请 ({pendingPromotions.length})
          </h3>
          <div className="space-y-2">
            {pendingPromotions.map((chef) => (
              <div key={chef.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center text-white font-bold">
                    {chef.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-earth-800">{chef.name}</p>
                    <p className="text-sm text-earth-500">
                      {getChefLevelLabel(chef.level)} · 技能 {chef.skill} · 申请晋升
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRejectPromotion(chef)} className="btn btn-secondary btn-sm">
                    拒绝
                  </button>
                  <button onClick={() => handleApprovePromotion(chef)} className="btn btn-primary btn-sm">
                    批准
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">厨师列表</h3>
            {chefs.length === 0 ? (
              <div className="text-center py-12 text-earth-500">
                <p className="text-4xl mb-3">👨‍🍳</p>
                <p>暂无厨师，点击上方按钮雇佣第一位厨师</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chefs.map((chef) => (
                  <div
                    key={chef.id}
                    onClick={() => setSelectedChef(chef)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedChef?.id === chef.id
                        ? 'border-warm-400 bg-warm-50'
                        : 'border-cream-100 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center text-white text-xl font-bold">
                          {chef.name.charAt(0)}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${getChefLevelBgColor(chef.level)}`}>
                          {getChefLevelLabel(chef.level).charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-earth-800">{chef.name}</span>
                          <span className={`badge ${getChefLevelBgColor(chef.level)}`}>{getChefLevelLabel(chef.level)}</span>
                          {chef.pending_promotion > 0 && (
                            <span className="badge badge-warning">待晋升</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-earth-500">
                          <span>技能: {chef.skill}</span>
                          <span>经验: {formatNumber(chef.exp)}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-earth-500">经验进度</span>
                            <span className="text-earth-500">{expProgress(chef).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-warm-400 to-warm-600"
                              style={{ width: `${expProgress(chef)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            {selectedChef ? (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-cream-200">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                      {selectedChef.name.charAt(0)}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-earth-800 mt-3">{selectedChef.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`badge ${getChefLevelBgColor(selectedChef.level)}`}>{getChefLevelLabel(selectedChef.level)}</span>
                  </div>
                  <p className="text-sm text-earth-500 mt-1">技能: {selectedChef.skill}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-earth-700 mb-3">能力雷达</h4>
                  <RadarChart
                    data={[
                      { subject: '技能', value: Math.min(100, selectedChef.skill) },
                      { subject: '经验', value: Math.min(100, selectedChef.exp / 100) },
                      { subject: '潜力', value: Math.min(100, (selectedChef.skill + selectedChef.exp / 100) / 2) },
                      { subject: '稳定', value: Math.min(100, selectedChef.skill * 0.8 + 20) },
                      { subject: '创意', value: Math.min(100, selectedChef.skill * 0.7 + 30) },
                    ]}
                    height={220}
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-cream-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-500">等级</span>
                    <span className="font-semibold text-earth-800">{getChefLevelLabel(selectedChef.level)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-500">技能值</span>
                    <span className="font-semibold text-blue-600">{selectedChef.skill}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-500">经验值</span>
                    <span className="font-semibold text-warm-600">{formatNumber(selectedChef.exp)}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-earth-500">经验进度</span>
                      <span className="text-earth-500">{expProgress(selectedChef).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-warm-400 to-warm-600"
                        style={{ width: `${expProgress(selectedChef)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setFireConfirm(selectedChef)}
                  className="btn w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                >
                  <span>🚪</span> 解雇厨师
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-earth-500">
                <p className="text-4xl mb-3">👈</p>
                <p>点击左侧厨师查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-earth-900/50 backdrop-blur-sm"
            onClick={() => setShowHireModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-earth-800 mb-4">雇佣新厨师</h3>
            {isLoading ? (
              <div className="py-8">
                <LoadingSpinner label="处理中..." />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">厨师姓名</label>
                  <input
                    type="text"
                    className="input"
                    value={newChef.name}
                    onChange={(e) => setNewChef({ ...newChef, name: e.target.value })}
                    placeholder="请输入厨师姓名"
                  />
                </div>
                <div className="p-4 bg-cream-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-600">雇佣费用</span>
                    <span className="font-bold text-warm-600">{formatNumber(50000)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-earth-600">初始等级</span>
                    <span className="font-bold text-earth-800">学徒</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowHireModal(false)} className="btn btn-secondary">
                    取消
                  </button>
                  <button onClick={handleHire} className="btn btn-primary">
                    确认雇佣
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!fireConfirm}
        title="确认解雇"
        message={`确定要解雇 ${fireConfirm?.name} 吗？此操作不可撤销。`}
        confirmText="确认解雇"
        onConfirm={() => fireConfirm && handleFire(fireConfirm)}
        onCancel={() => setFireConfirm(null)}
        type="danger"
      />
    </div>
  )
}
