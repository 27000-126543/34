import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { CUISINE_LABELS, DECOR_LABELS } from '../types'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    cuisineType: 'chinese',
    decorStyle: 'modern',
  })
  const { login, register, isLoading } = useGame()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(formData.username, formData.password)
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('两次输入的密码不一致')
          return
        }
        await register(
          formData.username,
          formData.email,
          formData.password,
          formData.restaurantName,
          formData.cuisineType,
          formData.decorStyle
        )
      }
      navigate('/')
    } catch {
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-cream-50 to-warm-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍜</div>
          <h1 className="text-3xl font-bold text-earth-800 mb-2">全球美食大亨</h1>
          <p className="text-earth-500">经营你的梦想餐厅，成为美食界传奇</p>
        </div>

        <div className="card">
          <div className="flex mb-6 bg-cream-100 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                mode === 'login'
                  ? 'bg-white text-warm-600 shadow-sm'
                  : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                mode === 'register'
                  ? 'bg-white text-warm-600 shadow-sm'
                  : 'text-earth-500 hover:text-earth-700'
              }`}
            >
              注册
            </button>
          </div>

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner label="处理中..." />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="label">用户名</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      placeholder="请输入用户名"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">餐厅名称</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.restaurantName}
                      onChange={(e) => updateField('restaurantName', e.target.value)}
                      placeholder="请输入你的餐厅名称"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">菜系类型</label>
                    <select
                      className="input"
                      value={formData.cuisineType}
                      onChange={(e) => updateField('cuisineType', e.target.value)}
                    >
                      {Object.entries(CUISINE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">装潢风格</label>
                    <select
                      className="input"
                      value={formData.decorStyle}
                      onChange={(e) => updateField('decorStyle', e.target.value)}
                    >
                      {Object.entries(DECOR_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="label">{mode === 'login' ? '用户名' : '邮箱'}</label>
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  className="input"
                  value={mode === 'login' ? formData.username : formData.email}
                  onChange={(e) => updateField(mode === 'login' ? 'username' : 'email', e.target.value)}
                  placeholder={mode === 'login' ? '请输入用户名' : '请输入邮箱'}
                  required
                />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="label">邮箱</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">密码</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="请输入密码"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="label">确认密码</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="请再次输入密码"
                    required
                    minLength={6}
                  />
                </div>
              )}
              <button type="submit" className="btn btn-primary w-full py-3 text-lg">
                {mode === 'login' ? '登录' : '创建账号'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
            <div className="text-2xl mb-1">🌍</div>
            <p className="text-xs text-earth-600">全球美食</p>
          </div>
          <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
            <div className="text-2xl mb-1">👨‍🍳</div>
            <p className="text-xs text-earth-600">名厨养成</p>
          </div>
          <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-xs text-earth-600">竞技对决</p>
          </div>
        </div>
      </div>
    </div>
  )
}
