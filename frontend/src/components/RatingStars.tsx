import { getRatingStars } from '../utils/helpers'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export default function RatingStars({ rating, size = 'md', showValue = true }: RatingStarsProps) {
  const { full, half, empty } = getRatingStars(rating)
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${sizeClasses[size]}`}>
        {Array.from({ length: full }).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">★</span>
        ))}
        {half && <span className="text-yellow-400">⯨</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`empty-${i}`} className="text-cream-300">★</span>
        ))}
      </div>
      {showValue && (
        <span className={`font-semibold text-earth-700 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
