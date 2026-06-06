import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts'

interface RadarDataItem {
  subject: string
  value: number
  fullMark?: number
}

interface RadarChartProps {
  data: RadarDataItem[]
  dataKey?: string
  color?: string
  height?: number
}

export function RadarChart({
  data,
  dataKey = 'value',
  color = '#F56B00',
  height = 300,
}: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={data} outerRadius="80%">
        <PolarGrid stroke="#E2D3AE" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#7A5640', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#947156', fontSize: 10 }}
        />
        <Radar
          name="评分"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}

interface LineDataItem {
  name: string
  [key: string]: string | number
}

interface LineChartProps {
  data: LineDataItem[]
  lines: { key: string; name: string; color?: string }[]
  height?: number
  showLegend?: boolean
}

export function LineChart({
  data,
  lines,
  height = 300,
  showLegend = true,
}: LineChartProps) {
  const defaultColors = ['#F56B00', '#22C55E', '#3B82F6', '#A855F7', '#EC4899']

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EFE6D0" />
        <XAxis
          dataKey="name"
          stroke="#947156"
          fontSize={12}
        />
        <YAxis stroke="#947156" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EFE6D0',
            borderRadius: '8px',
            color: '#4D342B',
          }}
        />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color || defaultColors[index % defaultColors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

interface AreaChartProps {
  data: LineDataItem[]
  dataKey: string
  name: string
  color?: string
  height?: number
}

export function AreaChartWrapper({
  data,
  dataKey,
  name,
  color = '#F56B00',
  height = 300,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EFE6D0" />
        <XAxis dataKey="name" stroke="#947156" fontSize={12} />
        <YAxis stroke="#947156" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EFE6D0',
            borderRadius: '8px',
            color: '#4D342B',
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill="url(#colorArea)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface BarChartProps {
  data: LineDataItem[]
  bars: { key: string; name: string; color?: string }[]
  height?: number
}

export function BarChartWrapper({
  data,
  bars,
  height = 300,
}: BarChartProps) {
  const defaultColors = ['#F56B00', '#22C55E', '#3B82F6']

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EFE6D0" />
        <XAxis dataKey="name" stroke="#947156" fontSize={12} />
        <YAxis stroke="#947156" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EFE6D0',
            borderRadius: '8px',
            color: '#4D342B',
          }}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name}
            fill={bar.color || defaultColors[index % defaultColors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
