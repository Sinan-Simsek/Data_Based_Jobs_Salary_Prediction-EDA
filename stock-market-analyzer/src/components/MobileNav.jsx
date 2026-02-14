import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Briefcase,
  Star,
} from 'lucide-react'

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/markets', icon: TrendingUp, label: 'Markets' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]
              ${isActive ? 'text-primary-400' : 'text-dark-500'}`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
