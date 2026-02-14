import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import InstallPrompt from './components/InstallPrompt'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import SearchPage from './pages/SearchPage'
import Markets from './pages/Markets'
import Portfolio from './pages/Portfolio'
import Watchlist from './pages/Watchlist'
import Predictions from './pages/Predictions'
import Screener from './pages/Screener'
import News from './pages/News'

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-dark-950">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 p-3 md:p-6 overflow-x-hidden pb-20 md:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/news" element={<News />} />
          </Routes>
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <MobileNav />
      <InstallPrompt />
    </div>
  )
}
