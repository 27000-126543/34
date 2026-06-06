import { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { leaderboardApi } from '../services/api'
import { formatCurrency, formatNumber, getCuisineLabel } from '../utils/helpers'

type LeaderboardTab = 'profit' | 'rating' | 'chef' | 'reputation' | 'popularity' | 'alliance' | 'cuisine'

interface LeaderboardEntry {
  rank: number
  [key: string]: any
}

export default function Leaderboard() {
  const { restaurant, addNotification } = useGame()
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('profit')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [cuisineStats, setCuisineStats] = useState<any[]>([])
  const [myRank, setMyRank] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'cuisine') {
      loadCuisineStats()
    } else {
      loadLeaderboard()
    }
    loadMyRank()
  }, [activeTab])

  const loadLeaderboard = async () => {
    setIsLoading(true)
    try {
      let result: any
      switch (activeTab) {
        case 'profit':
          result = await leaderboardApi.getProfit(100)
          break
        case 'rating':
          result = await leaderboardApi.getRating(100)
          break
        case 'chef':
          result = await leaderboardApi.getChefLevel(100)
          break
        case 'reputation':
          result = await leaderboardApi.getReputation(100)
          break
        case 'popularity':
          result = await leaderboardApi.getDishPopularity(100)
          break
        case 'alliance':
          result = await leaderboardApi.getAlliance(100)
          break
      }
      setData(result?.leaderboard || [])
    } catch {
      addNotification('加载排行榜失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCuisineStats = async () => {
    setIsLoading(true)
    try {
      const result = await leaderboardApi.getCuisineStats()
      setCuisineStats(result?.cuisine_stats || [])
    } catch {
      addNotification('加载菜系统计失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyRank = async () => {
    try {
      const result = await leaderboardApi.getMyRank()
      setMyRank(result?.rank || null)
    } catch {
      setMyRank(null)
    }
  }

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  const getTabConfig = (tab: LeaderboardTab) => {
    switch (tab) {
      case 'profit':
        return {
          title: '盈利能力榜',
          subtitle: '根据总利润排名',
          icon: '💰',
          displayKey: 'total_profit',
          displayLabel: '总利润',
          formatFn: (v: any) => formatCurrency(Number(v || 0)),
          nameKey: 'name',
        }
      case 'rating':
        return {
          title: '好评榜',
          subtitle: '根据顾客评分排名',
          icon: '⭐',
          displayKey: 'avg_rating',
          displayLabel: '平均评分',
          formatFn: (v: any) => `${Number(v || 0).toFixed(2)} 星`,
          nameKey: 'name',
        }
      case 'chef':
        return {
          title: '主厨实力榜',
          subtitle: '根据厨师等级和技能排名',
          icon: '👨‍🍳',
          displayKey: 'skill',
          displayLabel: '总技能值',
          formatFn: (v: any) => formatNumber(Number(v || 0)),
          nameKey: 'name',
        }
      case 'reputation':
        return {
          title: '声望榜',
          subtitle: '根据玩家声望值排名',
          icon: '🏅',
          displayKey: 'reputation',
          displayLabel: '声望值',
          formatFn: (v: any) => formatNumber(Number(v || 0)),
          nameKey: 'username',
        }
      case 'popularity':
        return {
          title: '菜品人气榜',
          subtitle: '根据菜品销量排名',
          icon: '🔥',
          displayKey: 'sales_count',
          displayLabel: '销量',
          formatFn: (v: any) => formatNumber(Number(v || 0)),
          nameKey: 'name',
        }
      case 'alliance':
        return {
          title: '联盟榜',
          subtitle: '根据联盟综合实力排名',
          icon: '🏰',
          displayKey: 'member_count',
          displayLabel: '成员数',
          formatFn: (v: any) => formatNumber(Number(v || 0)),
          nameKey: 'name',
        }
      default:
        return {
          title: '',
          subtitle: '',
          icon: '',
          displayKey: '',
          displayLabel: '',
          formatFn: (v: any) => String(v || ''),
          nameKey: 'name',
        }
    }
  }

  const renderCuisineStats = () => {
    if (cuisineStats.length === 0) {
      return (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-earth-500">暂无菜系统计数据</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cuisineStats.map((stat) => (
          <div key={stat.cuisine_type} className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🍽️</span>
              <h3 className="font-bold text-earth-800">
                {getCuisineLabel(stat.cuisine_type || '')}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-earth-500">餐厅数</span>
                <span className="font-semibold text-earth-700">
                  {formatNumber(Number(stat.restaurant_count || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-500">平均评分</span>
                <span className="text-yellow-600 font-semibold">
                  {Number(stat.avg_rating || 0).toFixed(2)}⭐
                </span>
              </div>
              {stat.total_revenue !== undefined && (
                <div className="flex justify-between">
                  <span className="text-earth-500">总收入</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(Number(stat.total_revenue || 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="加载排行榜..." />
      </div>
    )
  }

  if (activeTab === 'cuisine') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">🍽️ 菜系分布统计</h1>
          <p className="text-earth-500 mt-1">查看各菜系的经营数据统计</p>
        </div>

        <div className="flex gap-2 border-b border-cream-200 flex-wrap">
          {[
            { key: 'profit', label: '盈利能力', icon: '💰' },
            { key: 'rating', label: '好评榜', icon: '⭐' },
            { key: 'chef', label: '主厨实力', icon: '👨‍🍳' },
            { key: 'reputation', label: '声望榜', icon: '🏅' },
            { key: 'popularity', label: '菜品人气', icon: '🔥' },
            { key: 'alliance', label: '联盟榜', icon: '🏰' },
            { key: 'cuisine', label: '菜系分布', icon: '🍽️' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as LeaderboardTab)}
              className={`px-4 py-3 font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${
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

        {renderCuisineStats()}
      </div>
    )
  }

  const config = getTabConfig(activeTab)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-earth-800">{config.icon} {config.title}</h1>
        <p className="text-earth-500 mt-1">{config.subtitle}</p>
      </div>

      <div className="flex gap-2 border-b border-cream-200 flex-wrap">
        {[
          { key: 'profit', label: '盈利能力', icon: '💰' },
          { key: 'rating', label: '好评榜', icon: '⭐' },
          { key: 'chef', label: '主厨实力', icon: '👨‍🍳' },
          { key: 'reputation', label: '声望榜', icon: '🏅' },
          { key: 'popularity', label: '菜品人气', icon: '🔥' },
          { key: 'alliance', label: '联盟榜', icon: '🏰' },
          { key: 'cuisine', label: '菜系分布', icon: '🍽️' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as LeaderboardTab)}
            className={`px-4 py-3 font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${
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

      {myRank && myRank[activeTab] !== undefined && (
        <div className="card bg-gradient-to-r from-warm-50 to-cream-50 border-warm-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📍</div>
              <div>
                <p className="text-earth-500 text-sm">我的排名</p>
                <p className="text-3xl font-bold text-warm-600">#{myRank[activeTab]}</p>
              </div>
            </div>
            {myRank.display_value !== undefined && (
              <StatCard
                title={config.displayLabel}
                value={config.formatFn(myRank.display_value)}
                icon={config.icon}
                color="warm"
              />
            )}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">{config.icon}</p>
            <p className="text-earth-500">暂无排名数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-earth-700">排名</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-earth-700">名称</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-earth-700">{config.displayLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {data.map((entry) => {
                  const medal = getMedalIcon(entry.rank)
                  const isMine = restaurant && (entry.id === restaurant.id || entry.restaurant_id === restaurant.id)
                  return (
                    <tr
                      key={entry.rank}
                      className={`hover:bg-cream-50 transition-colors ${
                        isMine ? 'bg-warm-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {medal ? (
                            <span className="text-2xl">{medal}</span>
                          ) : (
                            <span className="text-lg font-bold text-earth-400 w-8 text-center">
                              {entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-earth-800">
                            {entry[config.nameKey] || entry.name || `#${entry.id}`}
                          </span>
                          {isMine && (
                            <span className="text-xs px-2 py-0.5 bg-warm-100 text-warm-700 rounded-full">
                              我
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-earth-800">
                          {config.formatFn(entry[config.displayKey])}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
