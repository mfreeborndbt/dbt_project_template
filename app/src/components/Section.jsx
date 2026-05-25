import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

export default function Section({ title, children, defaultOpen = true, icon }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3 group cursor-pointer">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <ChevronRight size={12} className={`text-dbt-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="space-y-0">{children}</div>}
    </div>
  )
}
