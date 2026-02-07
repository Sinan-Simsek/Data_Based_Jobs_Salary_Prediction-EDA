import { Activity } from 'lucide-react'

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Activity className="w-8 h-8 text-primary-400 animate-spin mb-3" />
      <p className="text-sm text-dark-400">{text}</p>
    </div>
  )
}
