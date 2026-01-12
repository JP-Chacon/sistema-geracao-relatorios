import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white text-gray-900 rounded-lg shadow-md p-6 border border-gray-200',
        '[&_*]:text-inherit', // Força herança de cor para todos os elementos filhos
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}










