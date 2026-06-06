interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  label?: string
}

export default function LoadingSpinner({ size = 'md', color = 'text-warm-500', label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-cream-200 border-t-current rounded-full animate-spin ${color}`}
      />
      {label && <p className="text-sm text-earth-500">{label}</p>}
    </div>
  )
}
