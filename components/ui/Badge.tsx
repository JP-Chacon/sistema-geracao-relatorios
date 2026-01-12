import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger'
  children: React.ReactNode
}

export function Badge({
  variant = 'info',
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    danger: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-semibold rounded-full',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}













