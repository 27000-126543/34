import { useGame } from '../contexts/GameContext'
import StatCard from '../components/StatCard'
import RatingStars from '../components/RatingStars'
import { LineChart, RadarChart } from '../components/Chart'
import { formatCurrency, formatNumber, getCuisineLabel, getDecorLabel, getChefLevelLabel, formatNumber as formatNum } from '../utils/helpers'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { player, restaurant, chefs, dishes } = useGame()

  const revenueData = [
    { name: '周一', 收入: 12500, 成本: 8200 },
    { name: '周二', 收入: 15800, 成本: 9100 },
    { name: '周三', 收入: 18200, 成本: 10500 },
    { name: '周四', 收入: 14300, 成本: 8800 },
    { name: '周五', 收入: 22100, 成本: 12800 },
    { name: '周六', 收入: 28500, 成本: 15200 },
    { name: '周日', 收入: 25800, 成本: 14100 },
  ]

  const chefSkillData = [
    { subject: '烹饪技能', value: chefs.length > 0 ? Math.round(chefs.reduce((s, c) => s + c.skill, 0) / chefs.length) : 70 },
    { subject: '团队规模', value: Math.min(100, chefs.length * 20) },
    { subject: '菜品丰富', value: Math.min(100, dishes.length * 10) },
    { subject: '装潢等级', value: restaurant ? Math.min(100, restaurant.level * 20) : 50 },
    { subject: '客户满意', value: restaurant ? Math.min(100, restaurant.avg_rating * 20) : 60 },
  ]

  const quickActions = [
    { icon: '🏪', label: '餐厅管理', path: '/restaurant', color: 'warm' },
    { icon: '👨‍🍳', label: '厨师管理', path: '/chefs', color: 'blue' },
    { icon: '🔬', label: '菜品研发', path: '/research', color: 'purple' },
    { icon: '🛒', label: '全球市场', path: '/market', color: 'green' },
    { icon: '🏆', label: '美食大赛', path: '/competition', color: 'red' },
    { icon: '📊', label: '运营报告', path: '/report', color: 'warm' },
  ]

  if (!player || !restaurant) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">欢迎回来，{player.username}！</h1>
          <p className="text-earth-500 mt-1">今天也要让餐厅蒸蒸日上哦 🍳</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-lg shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-earth-700">玩家声望</span>
              <span className="text-xs text-earth-400">
                {formatNum(player.reputation)}
              </span>
            </div>
            <div className="w-48 h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                style={{ width: `${Math.min(100, player.reputation / 100)}%` }}
              />
            </div>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-earth-700">研究点</span>
              <span className="text-xs text-earth-400">
                {formatNum(player.research_points)}
              </span>
            </div>
            <div className="w-32 h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                style={{ width: `${Math.min(100, player.research_points / 50)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="累计营收"
          value={formatCurrency(restaurant.total_profit)}
          icon="💰"
          color="green"
        />
        <StatCard
          title="玩家声望"
          value={formatNumber(player.reputation)}
          icon="⭐"
          color="purple"
        />
        <StatCard
          title="厨师数量"
          value={chefs.length}
          icon="👨‍🍳"
          changeLabel={`最高技能 ${chefs.length > 0 ? Math.max(...chefs.map(c => c.skill)) : 0}`}
          color="blue"
        />
        <StatCard
          title="餐厅评分"
          value={restaurant.avg_rating.toFixed(1)}
          icon="🏅"
          suffix=" 分"
          color="warm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-earth-800">近7日营收趋势</h2>
            <Link to="/report" className="text-sm text-warm-600 hover:text-warm-700">
              查看详情 →
            </Link>
          </div>
          <LineChart
            data={revenueData}
            lines={[
              { key: '收入', name: '收入', color: '#F56B00' },
              { key: '成本', name: '成本', color: '#947156' },
            ]}
            height={280}
          />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-earth-800">餐厅综合能力</h2>
          </div>
          <RadarChart data={chefSkillData} height={280} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-earth-800 mb-4">快速操作</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="flex flex-col items-center gap-2 p-4 bg-cream-50 rounded-xl hover:bg-warm-50 transition-colors group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <span className="text-sm font-medium text-earth-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-earth-800">餐厅概况</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-cream-50 rounded-lg">
              <div>
                <p className="font-semibold text-earth-800">{restaurant.name}</p>
                <p className="text-sm text-earth-500">{getCuisineLabel(restaurant.cuisine_type)}菜系 · {getDecorLabel(restaurant.decor_style)}</p>
              </div>
              <RatingStars rating={restaurant.avg_rating} size="lg" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-warm-50 rounded-lg">
                <p className="text-xs text-earth-500">餐厅等级</p>
                <p className="text-lg font-bold text-warm-600">Lv.{restaurant.level}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-earth-500">累计营收</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(restaurant.total_profit)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-earth-500">菜单数量</p>
                <p className="text-lg font-bold text-blue-600">{dishes.length} 道</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-earth-500">厨师团队</p>
                <p className="text-lg font-bold text-purple-600">{chefs.length} 位</p>
              </div>
            </div>

            {chefs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-earth-700 mb-2">厨师团队</p>
                <div className="flex -space-x-2">
                  {chefs.slice(0, 5).map((chef) => (
                    <div
                      key={chef.id}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-warm-400 to-warm-600 border-2 border-white flex items-center justify-center text-white text-sm font-bold"
                      title={`${chef.name} - ${getChefLevelLabel(chef.level)}`}
                    >
                      {chef.name.charAt(0)}
                    </div>
                  ))}
                  {chefs.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-earth-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      +{chefs.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
