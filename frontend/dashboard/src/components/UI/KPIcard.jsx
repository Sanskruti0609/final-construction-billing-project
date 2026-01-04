import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const KPIcard = ({ title, value, change, changeType = 'positive', icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  const changeColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600'
  const ChangeIcon = changeType === 'positive' ? TrendingUp : TrendingDown

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-1 text-sm ${changeColor}`}>
              <ChangeIcon className="w-4 h-4 mr-1" />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default KPIcard