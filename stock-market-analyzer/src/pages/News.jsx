import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, Clock, ExternalLink, Tag } from 'lucide-react'
import { getMarketNews } from '../services/stockData'

export default function News() {
  const news = useMemo(() => getMarketNews(), [])

  const categories = useMemo(() => {
    const cats = new Set(news.map(n => n.category))
    return ['All', ...Array.from(cats)]
  }, [news])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Newspaper className="w-6 h-6 text-primary-400" />
        Market News
      </h1>

      {/* Featured News */}
      {news.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-2 py-1 rounded">{news[0].category}</span>
            <span className="text-xs text-dark-500 flex items-center gap-1"><Clock className="w-3 h-3" />{news[0].time}</span>
            <span className="text-xs text-dark-500">{news[0].source}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">{news[0].title}</h2>
          <p className="text-sm text-dark-300 leading-relaxed">{news[0].summary}</p>
          {news[0].symbol && (
            <Link to={`/stock/${news[0].symbol}`} className="inline-flex items-center gap-1 mt-3 text-sm text-primary-400 hover:text-primary-300 font-medium">
              <Tag className="w-3 h-3" /> {news[0].symbol}
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.slice(1).map(item => (
          <div key={item.id} className="glass-card rounded-xl p-5 group hover:border-dark-600/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">{item.category}</span>
              <span className="text-[10px] text-dark-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{item.time}</span>
              <span className="text-[10px] text-dark-500">{item.source}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors leading-snug">
              {item.title}
            </h3>
            <p className="text-xs text-dark-400 leading-relaxed line-clamp-3">
              {item.summary}
            </p>
            {item.symbol && (
              <Link
                to={`/stock/${item.symbol}`}
                className="inline-flex items-center gap-1 mt-3 text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                <Tag className="w-3 h-3" /> {item.symbol}
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
