import { useState, useEffect, useRef } from 'react'
import { useGame } from '../contexts/GameContext'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { reportApi } from '../services/api'
import type { DailyReport } from '../types'
import { formatCurrency, formatNumber, formatDate } from '../utils/helpers'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts'

type ReportRange = 'daily' | 'weekly' | 'range'

const COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#fcd34d']

export default function Report() {
  const { restaurant, addNotification } = useGame()
  const [activeTab, setActiveTab] = useState<ReportRange>('daily')
  const [stats, setStats] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [weeklyData, setWeeklyData] = useState<DailyReport[]>([])
  const [rangeReports, setRangeReports] = useState<DailyReport[]>([])
  const [radarData, setRadarData] = useState<any[]>([])
  const [lineData, setLineData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [activeTab, selectedDate, startDate, endDate])

  const loadData = async () => {
    if (!restaurant) return
    setIsLoading(true)
    try {
      const statsResult = await reportApi.getStats(restaurant.id)
      setStats(statsResult)

      if (activeTab === 'daily') {
        const dailyResult = await reportApi.getDaily(restaurant.id, selectedDate)
        setDailyReport(dailyResult.report || null)
      }
      if (activeTab === 'weekly') {
        const weeklyResult = await reportApi.getWeekly(restaurant.id, endDate)
        setWeeklyData(weeklyResult.weekly || [])
      }
      if (activeTab === 'range') {
        const rangeResult = await reportApi.getRange(restaurant.id, startDate, endDate)
        setRangeReports(rangeResult.reports || [])
      }

      const radarResult = await reportApi.getRadarChart(restaurant.id)
      setRadarData(radarResult.chart_data || [])

      const lineResult = await reportApi.getLineChart(restaurant.id)
      setLineData(lineResult.chart_data || [])
    } catch {
      addNotification('加载报告失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!restaurant) return
    try {
      const result: any = await reportApi.exportPDF(restaurant.id)
      if (result?.data instanceof Blob) {
        const url = URL.createObjectURL(result.data)
        const a = document.createElement('a')
        a.href = url
        a.download = `经营报告_${new Date().toISOString().split('T')[0]}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        addNotification('报告已导出', 'success')
      } else {
        addNotification('导出成功', 'success')
      }
    } catch (e: any) {
      addNotification(e?.message || '导出失败', 'error')
    }
  }

  const chartData = activeTab === 'weekly' ? weeklyData : rangeReports

  const revenueChartData = chartData.map((r: DailyReport) => ({
    date: formatDate(r.date),
    revenue: r.total_revenue || 0,
    cost: r.total_cost || 0,
    profit: (r.total_revenue || 0) - (r.total_cost || 0),
  }))

  const customerChartData = chartData.map((r: DailyReport) => ({
    date: formatDate(r.date),
    customers: r.customer_count || 0,
    satisfaction: r.satisfaction_avg || 0,
  }))

  const popularDishes = dailyReport?.popular_dishes_json && Object.keys(dailyReport.popular_dishes_json).length > 0
    ? Object.entries(dailyReport.popular_dishes_json).map(([name, count]: any) => ({ name, value: count }))
    : []

  const ingredientCosts = dailyReport?.ingredient_costs_json && Object.keys(dailyReport.ingredient_costs_json).length > 0
    ? Object.entries(dailyReport.ingredient_costs_json).map(([name, cost]: any) => ({ name, cost }))
    : []

  const totalRevenueRange = chartData.reduce((sum: number, r: DailyReport) => sum + (r.total_revenue || 0), 0)
  const totalCostRange = chartData.reduce((sum: number, r: DailyReport) => sum + (r.total_cost || 0), 0)
  const totalProfitRange = totalRevenueRange - totalCostRange
  const totalCustomersRange = chartData.reduce((sum: number, r: DailyReport) => sum + (r.customer_count || 0), 0)
  const avgSatisfactionRange = chartData.length > 0
    ? chartData.reduce((sum: number, r: DailyReport) => sum + (r.satisfaction_avg || 0), 0) / chartData.length
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="加载报告..." />
      </div>
    )
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-800">📊 经营报告</h1>
          <p className="text-earth-500 mt-1">查看经营数据，分析业务表现</p>
        </div>
        <button onClick={handleExportPDF} className="btn btn-secondary">
          📄 导出 PDF
        </button>
      </div>

      <div className="flex gap-2 border-b border-cream-200 flex-wrap">
        {[
          { key: 'daily', label: '日报', icon: '📅' },
          { key: 'weekly', label: '周报', icon: '📆' },
          { key: 'range', label: '自定义', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ReportRange)}
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

      <div className="card">
        {activeTab === 'daily' && (
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">查询日期</label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        )}
        {activeTab === 'weekly' && (
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">截止日期</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
        {activeTab === 'range' && (
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="累计收入"
            value={formatCurrency(Number(stats.total_revenue || 0))}
            icon="💰"
            color="green"
          />
          <StatCard
            title="累计成本"
            value={formatCurrency(Number(stats.total_cost || 0))}
            icon="📉"
            color="red"
          />
          <StatCard
            title="累计利润"
            value={formatCurrency(Number(stats.total_profit || 0))}
            icon="📈"
            color="warm"
          />
          <StatCard
            title="服务顾客"
            value={formatNumber(Number(stats.total_customers || 0))}
            icon="👥"
            color="warm"
          />
        </div>
      )}

      {activeTab !== 'daily' && chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="总收入"
            value={formatCurrency(totalRevenueRange)}
            icon="💰"
            color="green"
          />
          <StatCard
            title="总成本"
            value={formatCurrency(totalCostRange)}
            icon="📉"
            color="red"
          />
          <StatCard
            title="总利润"
            value={formatCurrency(totalProfitRange)}
            icon="📈"
            color="warm"
          />
          <StatCard
            title="平均满意度"
            value={`${avgSatisfactionRange.toFixed(2)}⭐`}
            icon="😊"
            color="warm"
          />
        </div>
      )}

      {activeTab === 'daily' && dailyReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="今日收入"
            value={formatCurrency(dailyReport.total_revenue || 0)}
            icon="💰"
            color="green"
          />
          <StatCard
            title="今日成本"
            value={formatCurrency(dailyReport.total_cost || 0)}
            icon="📉"
            color="red"
          />
          <StatCard
            title="今日利润"
            value={formatCurrency((dailyReport.total_revenue || 0) - (dailyReport.total_cost || 0))}
            icon="📈"
            color="warm"
          />
          <StatCard
            title="服务顾客"
            value={formatNumber(dailyReport.customer_count || 0)}
            icon="👥"
            color="warm"
          />
        </div>
      )}

      {activeTab !== 'daily' && revenueChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">💰 收入与成本趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="收入" stroke="#16a34a" fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="cost" name="成本" stroke="#dc2626" fill="url(#colorCost)" />
                  <Area type="monotone" dataKey="profit" name="利润" stroke="#f59e0b" fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-earth-800 mb-4">👥 顾客与满意度</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="customers" name="顾客数" fill="#92400e" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="satisfaction" name="满意度" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'daily' && lineData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-earth-800 mb-4">📈 综合趋势图</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="收入" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" name="利润" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="customers" name="顾客" stroke="#92400e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {radarData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-earth-800 mb-4">🎯 能力雷达图</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e7e5e4" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#78716c' }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Radar name="评分" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'daily' && (popularDishes.length > 0 || ingredientCosts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {popularDishes.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-earth-800 mb-4">🍽️ 热门菜品</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popularDishes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {popularDishes.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {ingredientCosts.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-earth-800 mb-4">🛒 食材成本</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ingredientCosts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Bar dataKey="cost" name="成本" fill="#dc2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'daily' && dailyReport?.satisfaction_trend_json && Object.keys(dailyReport.satisfaction_trend_json).length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-earth-800 mb-4">😊 满意度趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Object.entries(dailyReport.satisfaction_trend_json).map(([time, score]: any) => ({ time, score }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" name="满意度" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'range' && rangeReports.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="text-lg font-bold text-earth-800 mb-4">📋 详细报告列表</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-earth-700">日期</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-earth-700">收入</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-earth-700">成本</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-earth-700">利润</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-earth-700">顾客数</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-earth-700">满意度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {rangeReports.map((r) => {
                  const profit = (r.total_revenue || 0) - (r.total_cost || 0)
                  return (
                    <tr key={r.id} className="hover:bg-cream-50">
                      <td className="px-4 py-3 text-sm text-earth-600">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(r.total_revenue || 0)}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(r.total_cost || 0)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${profit >= 0 ? 'text-warm-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-earth-700">{formatNumber(r.customer_count || 0)}</td>
                      <td className="px-4 py-3 text-right font-medium text-yellow-600">
                        {(r.satisfaction_avg || 0).toFixed(2)}⭐
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
