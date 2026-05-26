import { useState } from 'react'
import { WarehouseIcon, CloudIcon, DbtLogo, DagsterLogo } from './Icons'

export default function AcxiomArchitecture() {
  const [hoveredSection, setHoveredSection] = useState(null)

  const layers = [
    { label: 'Layer 1', name: 'Ingestion', hasDagster: true },
    { label: 'Layer 2', name: 'Curated' },
    { label: 'Layer 3', name: 'Gold' },
    { label: 'Layer 4', name: 'Consumption', hasDagster: true },
  ]

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      <div className="bg-dbt-card border border-dbt-border rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white mb-2">The big picture</h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          The implementation team builds and ships the pipeline. Once live, support manages customer requests and changes. Operations handles troubleshooting and monitoring.
        </p>

        <div className="flex items-center gap-4 justify-center flex-wrap">
          {/* Implementation container */}
          <div
            className={`relative border-2 border-dashed rounded-2xl px-5 pt-8 pb-5 transition-all duration-300 ${
              hoveredSection === 'implementation'
                ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                : 'border-blue-500/30 bg-blue-500/5'
            }`}
            onMouseEnter={() => setHoveredSection('implementation')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <span className={`absolute top-2.5 left-4 text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${
              hoveredSection === 'implementation' ? 'text-blue-300' : 'text-blue-500/60'
            }`}>Implementation</span>
            <div className="flex items-center gap-2">
              {layers.map((l, i) => (
                <div key={l.name} className="flex items-center gap-2">
                  <div className="px-4 py-3 rounded-xl bg-[#1a1f2e] border border-dbt-border text-center">
                    <span className="block text-[10px] text-gray-500 mb-0.5">{l.label}</span>
                    <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-300">
                      {l.name}
                      <span className="flex items-center gap-0.5">
                        <DbtLogo size={12} />
                        {l.hasDagster && <DagsterLogo size={12} />}
                      </span>
                    </span>
                  </div>
                  {i < layers.length - 1 && (
                    <svg width="20" height="12" viewBox="0 0 20 12" className="shrink-0">
                      <path d="M0 6 L14 6 M10 2 L15 6 L10 10" stroke="#4b5563" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fork arrows */}
          <svg width="40" height="72" viewBox="0 0 40 72" className="shrink-0" fill="none">
            <path d="M0 36 L12 36" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 36 L34 14" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M29 12 L35 14 L32 19" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M12 36 L34 58" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M32 53 L35 58 L29 60" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>

          {/* Support & Operations */}
          <div className="flex flex-col gap-3">
            <div
              className={`px-5 py-3.5 rounded-xl border-2 text-left transition-all duration-300 cursor-default ${
                hoveredSection === 'support'
                  ? 'border-indigo-400 bg-indigo-500/20 shadow-lg shadow-indigo-500/10'
                  : 'border-indigo-500/30 bg-indigo-500/10'
              }`}
              onMouseEnter={() => setHoveredSection('support')}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <span className={`block text-[10px] uppercase tracking-wider font-bold transition-colors ${
                hoveredSection === 'support' ? 'text-indigo-300' : 'text-indigo-400/60'
              }`}>Support</span>
              <span className="block text-sm font-semibold text-indigo-200">Managing changes</span>
            </div>
            <div
              className={`px-5 py-3.5 rounded-xl border-2 text-left transition-all duration-300 cursor-default ${
                hoveredSection === 'operations'
                  ? 'border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/10'
                  : 'border-violet-500/30 bg-violet-500/10'
              }`}
              onMouseEnter={() => setHoveredSection('operations')}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <span className={`block text-[10px] uppercase tracking-wider font-bold transition-colors ${
                hoveredSection === 'operations' ? 'text-violet-300' : 'text-violet-400/60'
              }`}>Operations</span>
              <span className="block text-sm font-semibold text-violet-200">Troubleshooting & monitoring</span>
            </div>
          </div>
        </div>

        {/* Platform footer */}
        <div className="border-t border-dbt-border mt-6 pt-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Works across your stack</p>
          <div className="bg-[#0d1117] border border-dbt-border rounded-lg px-4 py-3">
            <div className="flex items-center justify-center gap-5 flex-wrap">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0">Data Platform</span>
              <div className="flex items-center gap-1"><WarehouseIcon type="Snowflake" /><span className="text-[10px] text-gray-400">Snowflake</span></div>
              <div className="flex items-center gap-1"><WarehouseIcon type="Databricks" /><span className="text-[10px] text-gray-400">Databricks</span></div>
              <div className="w-px h-6 bg-gray-700 mx-1 shrink-0" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0">Cloud</span>
              <div className="flex items-center gap-1"><CloudIcon type="AWS" /><span className="text-[10px] text-gray-400">AWS</span></div>
              <div className="flex items-center gap-1"><CloudIcon type="Azure" /><span className="text-[10px] text-gray-400">Azure</span></div>
              <div className="flex items-center gap-1"><CloudIcon type="GCP" /><span className="text-[10px] text-gray-400">GCP</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
