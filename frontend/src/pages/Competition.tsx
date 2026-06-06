import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { competitionApi } from '../services/api'
import type { Competition } from '../types'
import { formatDate, formatDateTime, getCompetitionStatusLabel, getCompetitionStatusColor } from '../utils/helpers'

export default function Competition() {
  const { restaurant, player, addNotification } = useGame()
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed' | 'create'>('active')
  const [activeList, setActiveList] = useState<Competition[]>([])
  const [upcomingList, setUpcomingList] = useState<Competition[]>([])
  const [completedList, setCompletedList] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [newCompetitionDate, setNewCompetitionDate] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [active, upcoming, completed] = await Promise.all([
        competitionApi.listActive(),
        competitionApi.listUpcoming(),
        competitionApi.listCompleted(),
      ])
      setActiveList(active.competitions || [])
      setUpcomingList(upcoming.competitions || [])
      setCompletedList(completed.competitions || [])
    } catch {
      addNotification('加载比赛数据失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const openRegister = (comp: Competition) => {
    setSelectedCompetition(comp)
    setShowRegisterModal(true)
  }

  const handleRegister = async () => {
    if (!selectedCompetition || !restaurant) return
    setProcessingId(selectedCompetition.id)
    try {
      await competitionApi.register(selectedCompetition.id, { restaurant_id: restaurant.id })
      addNotification('报名成功！', 'success')
      setShowRegisterModal(false)
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '报名失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnregister = async (compId: number) => {
    if (!restaurant) return
    if (!confirm('确定要取消报名吗？')) return
    setProcessingId(compId)
    try {
      await competitionApi.unregister(compId, { restaurant_id: restaurant.id })
      addNotification('已取消报名', 'success')
      await loadData()
    } catch {
      addNotification('取消失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleStart = async (compId: number) => {
    setProcessingId(compId)
    try {
      const result: any = await competitionApi.start(compId)
      addNotification(result?.message || '比赛已开始！', 'success')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '开始失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleExecuteRound = async (compId: number) => {
    setProcessingId(compId)
    try {
      const result: any = await competitionApi.executeRound(compId)
      addNotification(result?.message || '回合已执行！', 'success')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '执行失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (compId: number) => {
    if (!confirm('确定要结束这场比赛吗？')) return
    setProcessingId(compId)
    try {
      const result: any = await competitionApi.complete(compId)
      addNotification(result?.message || '比赛已结束！', 'success')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '结束失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreate = async () => {
    if (!newCompetitionDate) return
    setProcessingId(-1)
    try {
      await competitionApi.create({ date: newCompetitionDate })
      addNotification('比赛创建成功！', 'success')
      setNewCompetitionDate('')
      setActiveTab('upcoming')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '创建失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const isRegistered = (comp: Competition) => {
    if (!restaurant) return false
    return (comp.participants_json || []).includes(restaurant.id)
  }

  const getCurrentList = () => {
    switch (activeTab) {
      case 'active':
        return activeList
      case 'upcoming':
        return upcomingList
      case 'completed':
        return completedList
      default:
        return []
    }
  }

  const currentList = getCurrentList()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="加载比赛..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">厨艺竞技</h1>
          <p className="text-earth-500 mt-1">参加比赛，展示实力，赢取奖励</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-cream-200 flex-wrap">
        {[
          { key: 'active', label: `进行中 (${activeList.length})`, icon: '🔥' },
          { key: 'upcoming', label: `即将开始 (${upcomingList.length})`, icon: '📅' },
          { key: 'completed', label: `已结束 (${completedList.length})`, icon: '🏆' },
          { key: 'create', label: '创建比赛', icon: '➕' },
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

      {activeTab === 'create' && (
        <div className="card max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-earth-800 mb-6">创建新比赛</h3>
          <div className="space-y-4">
            <div>
              <label className="label">比赛日期</label>
              <input
                type="datetime-local"
                className="input"
                value={newCompetitionDate}
                onChange={(e) => setNewCompetitionDate(e.target.value)}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={processingId === -1 || !newCompetitionDate}
              className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
            >
              {processingId === -1 ? <LoadingSpinner size="sm" /> : '🏆 创建比赛'}
            </button>
          </div>
        </div>
      )}

      {activeTab !== 'create' && (
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-earth-500">暂无比赛</p>
            </div>
          ) : (
            currentList.map((comp) => (
              <div key={comp.id} className="card card-hover">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-earth-800 text-lg">
                        厨艺大赛 #{comp.id}
                      </h3>
                      <span className={`badge ${getCompetitionStatusColor(comp.status)}`}>
                        {getCompetitionStatusLabel(comp.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-earth-500">
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{formatDateTime(comp.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>参赛者 {(comp.participants_json || []).length} 人</span>
                      </div>
                    </div>
                    {comp.participants_details && comp.participants_details.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-cream-100">
                        <p className="text-sm text-earth-500 mb-2">参赛餐厅：</p>
                        <div className="flex flex-wrap gap-2">
                          {comp.participants_details.map((p: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-cream-100 text-earth-600 rounded"
                            >
                              {p.name || `#${p.id}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {comp.results_json && Object.keys(comp.results_json).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-cream-100">
                        <p className="text-sm text-earth-500 mb-2">比赛结果：</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(comp.results_json).map(([rid, score]) => (
                            <span
                              key={rid}
                              className="text-xs px-2 py-1 bg-warm-50 text-warm-700 rounded"
                            >
                              #{rid}: {score}分
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {comp.status === 'upcoming' && !isRegistered(comp) && (
                      <button
                        onClick={() => openRegister(comp)}
                        className="btn btn-primary"
                      >
                        报名参赛
                      </button>
                    )}
                    {comp.status === 'upcoming' && isRegistered(comp) && (
                      <button
                        onClick={() => handleUnregister(comp.id)}
                        disabled={processingId === comp.id}
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        {processingId === comp.id ? <LoadingSpinner size="sm" /> : '取消报名'}
                      </button>
                    )}
                    {comp.status === 'upcoming' && player && (
                      <button
                        onClick={() => handleStart(comp.id)}
                        disabled={processingId === comp.id}
                        className="btn btn-primary disabled:opacity-50"
                      >
                        {processingId === comp.id ? <LoadingSpinner size="sm" /> : '开始比赛'}
                      </button>
                    )}
                    {comp.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleExecuteRound(comp.id)}
                          disabled={processingId === comp.id}
                          className="btn btn-primary disabled:opacity-50"
                        >
                          {processingId === comp.id ? <LoadingSpinner size="sm" /> : '执行回合'}
                        </button>
                        <button
                          onClick={() => handleComplete(comp.id)}
                          disabled={processingId === comp.id}
                          className="btn btn-secondary disabled:opacity-50"
                        >
                          结束比赛
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showRegisterModal && selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-earth-800">报名参赛</h3>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-earth-400 hover:text-earth-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-earth-600 mb-6">
                确定要参加「<span className="font-semibold">厨艺大赛 #{selectedCompetition.id}</span>」吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleRegister}
                  disabled={processingId === selectedCompetition.id}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {processingId === selectedCompetition.id ? <LoadingSpinner size="sm" /> : '确认报名'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
