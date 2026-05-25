export default function ChipSelect({ options, selected, onChange, label }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      if (selected.length > 1) onChange(selected.filter(s => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }
  return (
    <div className="mb-5">
      <label className="block text-xs font-medium text-dbt-muted mb-2 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt)
          return (
            <button key={opt} onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${
                active
                  ? 'bg-dbt-orange/15 border-dbt-orange text-dbt-orange'
                  : 'bg-transparent border-dbt-border text-dbt-muted hover:border-dbt-muted'
              }`}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
