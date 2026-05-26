import { FileText, Server, GitBranch, Code2, Rocket } from 'lucide-react'
import { DbtLogo } from './Icons'

const steps = [
  {
    icon: FileText,
    label: 'Intake Form',
    description: 'Configure pipeline parameters',
    color: '#ff694a',
    bgColor: 'rgba(255, 105, 74, 0.1)',
    borderColor: 'rgba(255, 105, 74, 0.3)',
  },
  {
    icon: () => <DbtLogo size={20} />,
    label: 'dbt platform project',
    description: 'Project, environments, and jobs created',
    color: '#ff694a',
    bgColor: 'rgba(255, 105, 74, 0.1)',
    borderColor: 'rgba(255, 105, 74, 0.3)',
  },
  {
    icon: Server,
    label: 'Data platform connected',
    description: 'Snowflake connection and credentials configured',
    color: '#29b5e8',
    bgColor: 'rgba(41, 181, 232, 0.1)',
    borderColor: 'rgba(41, 181, 232, 0.3)',
  },
  {
    icon: GitBranch,
    label: 'Git repo populated',
    description: 'dbt models, tests, and docs pushed to main',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  {
    icon: Rocket,
    label: 'Production deployed',
    description: 'Production-grade environment ready to build',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
]

export default function DesignToDeployDiagram() {
  return (
    <div className="max-w-[1200px] mx-auto p-8">
      <div className="bg-dbt-card border border-dbt-border rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white mb-2">Design-to-deploy automation</h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          From intake form to production-grade dbt environment in a single click. Every step is automated.
        </p>

        {/* Architecture flow */}
        <div className="flex items-stretch gap-0 justify-center">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center">
                <div
                  className="relative flex flex-col items-center text-center px-4 py-5 rounded-xl border-2 w-[180px] transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: step.bgColor,
                    borderColor: step.borderColor,
                    boxShadow: `0 0 20px ${step.bgColor}`,
                  }}
                >
                  {/* Step number */}
                  <div
                    className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: step.color, color: '#0a0c10' }}
                  >
                    {i + 1}
                  </div>

                  {/* Icon */}
                  <div className="mb-3 mt-1" style={{ color: step.color }}>
                    <Icon size={24} />
                  </div>

                  {/* Label */}
                  <span className="text-xs font-semibold text-white mb-1 leading-tight">{step.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{step.description}</span>
                </div>

                {/* Arrow */}
                {i < steps.length - 1 && (
                  <svg width="32" height="16" viewBox="0 0 32 16" className="shrink-0 mx-1">
                    <defs>
                      <linearGradient id={`arrow-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={step.color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={steps[i + 1].color} stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 8 L24 8 M20 3 L26 8 L20 13"
                      stroke={`url(#arrow-grad-${i})`}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom summary */}
        <div className="mt-8 border-t border-dbt-border pt-4">
          <div className="flex items-center justify-center gap-8 text-[10px] text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-dbt-orange" />
              Automated
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Production-ready
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              Version-controlled
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
