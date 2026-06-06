import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { allianceApi } from '../services/api'
import type { Alliance, Duel, Inventory } from '../types'
import { formatCurrency, formatNumber, formatDateTime } from '../utils/helpers'

export default function AlliancePage() {
  const { player, restaurant, addNotification } = useGame()
  const [activeTab, setActiveTab] = useState<'list' | 'inventory' | 'duels' | 'create'>('list')
  const [alliances, setAlliances] = useState<Alliance[]>([])
  const [myAlliance, setMyAlliance] = useState<Alliance | null>(null)
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [duels, setDuels] = useState<Duel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedAlliance, setSelectedAlliance] = useState<Alliance | null>(null)
  const [showDuelModal, setShowDuelModal] = useState(false)
  const [targetAllianceId, setTargetAllianceId] = useState<number | null>(null)

  const [newAlliance, setNewAlliance] = useState({
    name: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await allianceApi.list()
      setAlliances(result.alliances || [])
      try {
        const myResult = await allianceApi.listByPlayer()
        const myAlliances = myResult.alliances || []
        if (myAlliances.length > 0) {
          setMyAlliance(myAlliances[0])
          try {
            const invResult = await allianceApi.getInventory(myAlliances[0].id)
            setInventory(invResult.inventory || [])
          } catch {
            setInventory([])
          }
          try {
            const duelResult = await allianceApi.getDuels(myAlliances[0].id)
            setDuels(duelResult.duels || [])
          } catch {
            setDuels([])
          }
        } else {
          setMyAlliance(null)
          setInventory([])
          setDuels([])
        }
      } catch {
        setMyAlliance(null)
      }
    } catch {
      addNotification('加载联盟数据失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newAlliance.name.trim()) return
    setProcessingId(-1)
    try {
      await allianceApi.create({
        name: newAlliance.name,
      })
      addNotification('联盟创建成功！', 'success')
      setNewAlliance({ name: '' })
      setActiveTab('list')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '创建失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const openJoin = (alliance: Alliance) => {
    setSelectedAlliance(alliance)
    setShowJoinModal(true)
  }

  const handleJoin = async () => {
    if (!selectedAlliance) return
    setProcessingId(selectedAlliance.id)
    try {
      await allianceApi.join(selectedAlliance.id)
      addNotification('加入联盟成功！', 'success')
      setShowJoinModal(false)
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '加入失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleLeave = async () => {
    if (!myAlliance) return
    if (!confirm('确定要离开当前联盟吗？')) return
    setProcessingId(myAlliance.id)
    try {
      await allianceApi.leave(myAlliance.id)
      addNotification('已离开联盟', 'success')
      await loadData()
    } catch {
      addNotification('离开失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDisband = async () => {
    if (!myAlliance) return
    if (!confirm('确定要解散联盟吗？此操作不可撤销！')) return
    setProcessingId(myAlliance.id)
    try {
      await allianceApi.disband(myAlliance.id)
      addNotification('联盟已解散', 'success')
      await loadData()
    } catch {
      addNotification('解散失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const openDuel = (targetId: number) => {
    setTargetAllianceId(targetId)
    setShowDuelModal(true)
  }

  const handleInitiateDuel = async () => {
    if (!myAlliance || !targetAllianceId || !restaurant) return
    setProcessingId(targetAllianceId)
    try {
      await allianceApi.initiateDuel({
        challenger_restaurant_id: restaurant.id,
        defender_restaurant_id: targetAllianceId,
      })
      addNotification('对决已发起！', 'success')
      setShowDuelModal(false)
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '发起对决失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleExecuteDuel = async (duelId: number) => {
    setProcessingId(duelId)
    try {
      const result: any = await allianceApi.executeDuel(duelId)
      addNotification(result?.message || '对决已执行！', 'success')
      await loadData()
    } catch (e: any) {
      addNotification(e?.message || '执行对决失败', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const isFounder = (alliance: Alliance) => {
    if (!player) return false
    return alliance.founder_id === player.id
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="加载联盟..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">厨师联盟</h1>
          <p className="text-earth-500 mt-1">加入联盟，共享资源，参与对抗</p>
        </div>
        {myAlliance && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
              <span>🏰</span>
              <span className="font-semibold text-purple-700">{myAlliance.name}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-cream-200 flex-wrap">
        {[
          { key: 'list', label: '联盟列表', icon: '🏰' },
          { key: 'inventory', label: '共享库存', icon: '📦' },
          { key: 'duels', label: '联盟对决', icon: '⚔️' },
          { key: 'create', label: '创建联盟', icon: '➕' },
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

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alliances.map((a) => (
            <div key={a.id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-earth-800 text-lg">{a.name}</h3>
                  {a.founder && (
                    <p className="text-sm text-earth-500 mt-1">创立者：{a.founder.username}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-earth-500">成员数</span>
                  <span className="font-semibold text-earth-700">{(a.members_json || []).length}</span>
                </div>
                {a.created_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-earth-500">创建时间</span>
                    <span className="text-earth-600">{formatDateTime(a.created_at)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {myAlliance && myAlliance.id !== a.id && (
                  <button
                    onClick={() => openDuel(a.id)}
                    className="btn btn-secondary flex-1"
                  >
                    ⚔️ 发起对决
                  </button>
                )}
                {!myAlliance && (
                  <button
                    onClick={() => openJoin(a)}
                    className="btn btn-primary flex-1"
                  >
                    加入联盟
                  </button>
                )}
                {myAlliance && myAlliance.id === a.id && isFounder(a) && (
                  <button
                    onClick={handleDisband}
                    disabled={processingId === a.id}
                    className="btn btn-secondary flex-1 disabled:opacity-50"
                  >
                    {processingId === a.id ? <LoadingSpinner size="sm" /> : '解散联盟'}
                  </button>
                )}
                {myAlliance && myAlliance.id === a.id && !isFounder(a) && (
                  <button
                    onClick={handleLeave}
                    disabled={processingId === a.id}
                    className="btn btn-secondary flex-1 disabled:opacity-50"
                  >
                    {processingId === a.id ? <LoadingSpinner size="sm" /> : '离开联盟'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {alliances.length === 0 && (
            <div className="col-span-full text-center py-12 text-earth-500">
              <p className="text-4xl mb-3">🏰</p>
              <p>暂无联盟，去创建一个吧！</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          {!myAlliance ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-earth-500">请先加入联盟查看共享库存</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((inv) => (
                <div key={inv.id} className="card">
                  <div className="mb-3">
                    <h3 className="font-bold text-earth-800">{inv.ingredient_name}</h3>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-earth-500">联盟库存</span>
                      <span className="font-semibold text-earth-700">{formatNumber(inv.quantity)}</span>
                    </div>
                    {inv.current_price !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">当前价格</span>
                        <span className="text-earth-600">{formatCurrency(inv.current_price)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {inventory.length === 0 && (
                <div className="col-span-full text-center py-12 text-earth-500">
                  <p className="text-3xl mb-2">📦</p>
                  <p>联盟共享库存为空</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'duels' && (
        <div>
          {!myAlliance ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">⚔️</p>
              <p className="text-earth-500">请先加入联盟查看对决</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duels.map((d) => (
                <div key={d.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-earth-800">联盟对决 #{d.id}</h3>
                    <span className={`badge ${d.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {d.status === 'active' ? '进行中' : '已完成'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-earth-800">挑战方 #{d.challenger_id}</p>
                    </div>
                    <div className="text-2xl text-earth-400">VS</div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-earth-800">防守方 #{d.defender_id}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm mb-4">
                    {d.winner_id && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">获胜方</span>
                        <span className="font-semibold text-green-600">
                          {d.winner_id === d.challenger_id ? '挑战方' : '防守方'}
                        </span>
                      </div>
                    )}
                    {d.start_time && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">开始时间</span>
                        <span className="text-earth-600">{formatDateTime(d.start_time)}</span>
                      </div>
                    )}
                    {d.end_time && (
                      <div className="flex justify-between">
                        <span className="text-earth-500">结束时间</span>
                        <span className="text-earth-600">{formatDateTime(d.end_time)}</span>
                      </div>
                    )}
                  </div>
                  {d.status === 'active' && (
                    <button
                      onClick={() => handleExecuteDuel(d.id)}
                      disabled={processingId === d.id}
                      className="btn btn-primary w-full disabled:opacity-50"
                    >
                      {processingId === d.id ? <LoadingSpinner size="sm" /> : '⚔️ 开始对决'}
                    </button>
                  )}
                </div>
              ))}
              {duels.length === 0 && (
                <div className="col-span-full text-center py-12 text-earth-500">
                  <p className="text-3xl mb-2">⚔️</p>
                  <p>暂无对决记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-earth-800 mb-6">创建新联盟</h3>
          <div className="space-y-4">
            <div>
              <label className="label">联盟名称</label>
              <input
                className="input"
                placeholder="例如：御膳房兄弟连"
                value={newAlliance.name}
                onChange={(e) => setNewAlliance((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={processingId === -1 || !newAlliance.name.trim() || myAlliance !== null}
              className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
            >
              {processingId === -1 ? (
                <LoadingSpinner size="sm" />
              ) : myAlliance ? (
                '您已在联盟中'
              ) : (
                '🏰 创建联盟'
              )}
            </button>
          </div>
        </div>
      )}

      {showJoinModal && selectedAlliance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-earth-800">加入联盟</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-earth-400 hover:text-earth-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-earth-600 mb-6">
                确定要加入「<span className="font-semibold">{selectedAlliance.name}</span>」吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleJoin}
                  disabled={processingId === selectedAlliance.id}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {processingId === selectedAlliance.id ? <LoadingSpinner size="sm" /> : '确认加入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDuelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-earth-800">发起联盟对决</h3>
                <button
                  onClick={() => setShowDuelModal(false)}
                  className="text-earth-400 hover:text-earth-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-earth-600 mb-6">
                确定要向目标联盟发起对决吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDuelModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleInitiateDuel}
                  disabled={processingId === targetAllianceId}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {processingId === targetAllianceId ? <LoadingSpinner size="sm" /> : '确认发起'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
