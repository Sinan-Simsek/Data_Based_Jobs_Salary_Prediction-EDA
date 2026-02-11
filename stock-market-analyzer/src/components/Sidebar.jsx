import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Briefcase,
  Newspaper,
  BarChart3,
  Star,
  Settings,
  Activity,
  Brain,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Stock Search' },
  { to: '/markets', icon: TrendingUp, label: 'Markets' },
  { to: '/predictions', icon: Brain, label: 'AI Predictions' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/screener', icon: BarChart3, label: 'Screener' },
  { to: '/news', icon: Newspaper, label: 'News' },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sticky top-0 h-screen flex-shrink-0 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-700/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-white tracking-tight">MarketPulse</span>
        )}
      </div>

      <nav className="mt-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 border border-transparent'
              }
              ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 left-0 right-0 px-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 w-full transition-all border border-transparent"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <Settings className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
