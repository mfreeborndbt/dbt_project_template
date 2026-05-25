export default function RadioSelect({ options, selected, onChange, label }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-medium text-dbt-muted mb-2 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        {options.map(opt => {
          const active = selected === opt
          return (
            <button key={opt} onClick={() => onChange(opt)}
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
