import { ReactNode } from 'react'
import { Card, CardContent } from './card'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-5">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-400 text-lg max-w-sm mx-auto">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  )
}
