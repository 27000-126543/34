import { NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', icon: '🏠', label: '控制台' },
  { path: '/restaurant', icon: '🏪', label: '餐厅管理' },
  { path: '/chefs', icon: '👨‍🍳', label: '厨师管理' },
  { path: '/research', icon: '🔬', label: '菜品研发' },
  { path: '/market', icon: '🛒', label: '全球市场' },
  { path: '/competition', icon: '🏆', label: '美食大赛' },
  { path: '/alliance', icon: '🤝', label: '联盟系统' },
  { path: '/report', icon: '📊', label: '运营报告' },
  { path: '/leaderboard', icon: '📈', label: '全服排行' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-cream-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-warm-500 text-white shadow-md'
                  : 'text-earth-700 hover:bg-cream-100 hover:text-warm-600'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cream-200 bg-gradient-to-r from-warm-50 to-cream-50">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-card">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="text-sm font-semibold text-earth-800">每日目标</p>
            <p className="text-xs text-earth-500">完成任务获取奖励</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
