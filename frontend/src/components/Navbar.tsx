import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { formatCurrency, formatNumber } from '../utils/helpers'

export default function Navbar() {
  const { player, notifications, removeNotification, logout } = useGame()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-cream-200 z-50 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍜</span>
          <span className="text-xl font-bold text-warm-600">全球美食大亨</span>
        </Link>

        <div className="flex items-center gap-6">
          {player && (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-full">
                  <span>💰</span>
                  <span className="font-semibold text-yellow-700">{formatCurrency(player.coins)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                  <span>⭐</span>
                  <span className="font-semibold text-blue-700">{formatNumber(player.reputation)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full">
                  <span>🔬</span>
                  <span className="font-semibold text-purple-700">{formatNumber(player.research_points)}</span>
                </div>
              </div>

              <div className="relative">
                <button className="relative p-2 text-earth-600 hover:bg-cream-100 rounded-lg">
                  <span className="text-xl">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notifications.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-cream-200 overflow-hidden">
                    <div className="p-3 bg-cream-50 border-b border-cream-200">
                      <span className="font-semibold text-earth-800">通知</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b border-cream-100 flex justify-between items-start gap-2 ${
                            notif.type === 'success' ? 'bg-green-50' :
                            notif.type === 'warning' ? 'bg-yellow-50' :
                            notif.type === 'error' ? 'bg-red-50' : 'bg-white'
                          }`}
                        >
                          <p className="text-sm text-earth-800">{notif.message}</p>
                          <button
                            onClick={() => removeNotification(notif.id)}
                            className="text-earth-400 hover:text-earth-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-earth-800">{player.username}</span>
                  <span className="text-xs text-earth-500">{player.email}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center text-white font-bold">
                  {player.username.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-earth-500 hover:text-red-500 transition-colors"
                  title="退出登录"
                >
                  <span className="text-xl">🚪</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
