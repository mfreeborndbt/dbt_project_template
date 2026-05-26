export default function TextInput({ label, value, onChange, placeholder, mono, secret }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-dbt-muted mb-1.5 uppercase tracking-wider">{label}</label>
      <input type={secret ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-[#0d1117] border border-dbt-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-dbt-orange transition-colors ${mono ? 'font-mono text-xs' : ''}`} />
    </div>
  )
}
