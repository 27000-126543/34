interface StatCardProps {
  title: string
  value: string | number
  icon?: string
  change?: number
  changeLabel?: string
  color?: 'warm' | 'green' | 'blue' | 'purple' | 'red'
  suffix?: string
  prefix?: string
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  color = 'warm',
  suffix,
  prefix,
}: StatCardProps) {
  const colorClasses = {
    warm: 'from-warm-400 to-warm-600',
    green: 'from-green-400 to-green-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
    red: 'from-red-400 to-red-600',
  }

  const bgColors = {
    warm: 'bg-warm-50',
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    red: 'bg-red-50',
  }

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-earth-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-earth-800">
            {prefix}{typeof value === 'number' ? value.toLocaleString('zh-CN') : value}{suffix}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-earth-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}
          >
            {icon}
          </div>
        )}
      </div>
      {changeLabel && change === undefined && (
        <div className={`mt-3 p-2 rounded-lg ${bgColors[color]}`}>
          <p className="text-xs text-earth-600">{changeLabel}</p>
        </div>
      )}
    </div>
  )
}
