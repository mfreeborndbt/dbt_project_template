import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Upload, Send, Server, GitBranch, SlidersHorizontal, Trash2, Check, Loader2, AlertCircle, Layout, Workflow } from 'lucide-react'
import * as XLSX from 'xlsx'

import { SOURCE_OPTIONS, IDENTITY_OPTIONS, CLEANSING_OPTIONS, AUDIENCE_OPTIONS, PII_OPTIONS, WAREHOUSE_OPTIONS, CLOUD_OPTIONS } from './constants'
import { getTransformationStages, getStats, getSampleSQL } from './pipeline'
import ChipSelect from './components/ChipSelect'
import RadioSelect from './components/RadioSelect'
import TextInput from './components/TextInput'
import Section from './components/Section'
import PipelineDiagram from './components/PipelineDiagram'
import AcxiomArchitecture from './components/AcxiomArchitecture'
import DesignToDeployDiagram from './components/DesignToDeployDiagram'
import { WarehouseIcon, CloudIcon, DbtLogo } from './components/Icons'

export default function App() {
  const [sources, setSources] = useState(['Customer Data', 'Prospect Data', 'Event Data', 'Suppression Data', 'Reference Data'])
  const [identity, setIdentity] = useState('Standard')
  const [cleansing, setCleansing] = useState('Standard')
  const [audiences, setAudiences] = useState(['Marketing Audiences', 'Analytics Audiences', 'Compliance Lists', 'Operations Views'])
  const [pii, setPii] = useState('Standard')

  const [warehouse, setWarehouse] = useState('Snowflake')
  const [cloud, setCloud] = useState('AWS')
  const [dbtAccountId, setDbtAccountId] = useState(import.meta.env.VITE_DBT_ACCOUNT_ID || '')
  const [dbtAccessUrl, setDbtAccessUrl] = useState(import.meta.env.VITE_DBT_ACCESS_URL || 'cloud.getdbt.com')
  const [dbtApiToken, setDbtApiToken] = useState(import.meta.env.VITE_DBT_API_TOKEN || '')
  const [gitRepo, setGitRepo] = useState(import.meta.env.VITE_GIT_REPO || '')
  const [gitOrg, setGitOrg] = useState(import.meta.env.VITE_GIT_ORG || '')
  const [gitToken, setGitToken] = useState(import.meta.env.VITE_GIT_TOKEN || '')
  const [projectName, setProjectName] = useState('acxiom_client_pipeline')

  const [sfAccount, setSfAccount] = useState(import.meta.env.VITE_SF_ACCOUNT || '')
  const [sfWarehouse, setSfWarehouse] = useState(import.meta.env.VITE_SF_WAREHOUSE || '')
  const [sfUser, setSfUser] = useState(import.meta.env.VITE_SF_USER || '')
  const [sfDatabase, setSfDatabase] = useState(import.meta.env.VITE_SF_DATABASE || '')
  const [dbxWorkspaceUrl, setDbxWorkspaceUrl] = useState('')
  const [dbxHttpPath, setDbxHttpPath] = useState('')
  const [bqProject, setBqProject] = useState('')
  const [bqLocation, setBqLocation] = useState('US')

  const [uploadName, setUploadName] = useState(null)
  const fileInputRef = useRef(null)
  const [animKey, setAnimKey] = useState(0)

  // Tab state
  const [activeTab, setActiveTab] = useState('architecture') // architecture | automation | generator

  // Deploy/Destroy state
  const [deployStatus, setDeployStatus] = useState('idle') // idle | deploying | deployed | error
  const [deployResult, setDeployResult] = useState(null)
  const [deployLog, setDeployLog] = useState([])
  const [destroyStatus, setDestroyStatus] = useState('idle') // idle | destroying | error

  useEffect(() => {
    setAnimKey(k => k + 1)
  }, [sources.join(','), identity, cleansing, audiences.join(','), pii])

  const stages = useMemo(() => getTransformationStages(identity, cleansing, pii), [identity, cleansing, pii])
  const stats = useMemo(() => getStats(sources, stages, audiences), [sources, stages, audiences])
  const sampleSQL = useMemo(() => getSampleSQL(cleansing, pii), [cleansing, pii])

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws)

        data.forEach(row => {
          const param = (row.Parameter || row.parameter || '').toString().trim().toLowerCase()
          const value = (row.Value || row.value || '').toString().trim()

          if (param.includes('source')) {
            const vals = value.split(',').map(v => v.trim()).filter(v =>
              SOURCE_OPTIONS.some(o => o.toLowerCase() === v.toLowerCase())
            )
            const matched = vals.map(v => SOURCE_OPTIONS.find(o => o.toLowerCase() === v.toLowerCase()))
            if (matched.length > 0) setSources(matched)
          }
          if (param.includes('identity')) {
            const match = IDENTITY_OPTIONS.find(o => o.toLowerCase() === value.toLowerCase())
            if (match) setIdentity(match)
          }
          if (param.includes('cleans')) {
            const match = CLEANSING_OPTIONS.find(o => o.toLowerCase() === value.toLowerCase())
            if (match) setCleansing(match)
          }
          if (param.includes('audience') || param.includes('output')) {
            const vals = value.split(',').map(v => v.trim()).filter(v =>
              AUDIENCE_OPTIONS.some(o => o.toLowerCase() === v.toLowerCase())
            )
            const matched = vals.map(v => AUDIENCE_OPTIONS.find(o => o.toLowerCase() === v.toLowerCase()))
            if (matched.length > 0) setAudiences(matched)
          }
          if (param.includes('pii')) {
            const match = PII_OPTIONS.find(o => o.toLowerCase() === value.toLowerCase())
            if (match) setPii(match)
          }
          if (param.includes('warehouse') || param.includes('target')) {
            const match = WAREHOUSE_OPTIONS.find(o => o.toLowerCase() === value.toLowerCase())
            if (match) setWarehouse(match)
          }
          if (param.includes('cloud')) {
            const match = CLOUD_OPTIONS.find(o => o.toLowerCase() === value.toLowerCase())
            if (match) setCloud(match)
          }
          if (param.includes('project') && param.includes('name')) setProjectName(value)
          if (param.includes('account') && param.includes('id')) setDbtAccountId(value)
          if (param.includes('git') && param.includes('repo')) setGitRepo(value)
          if (param.includes('git') && param.includes('org')) setGitOrg(value)
        })
      } catch (err) {
        console.error('File parse error:', err)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleDeploy = useCallback(async () => {
    setDeployStatus('deploying')
    setDeployLog([{ msg: 'Initializing deployment...', status: 'running', time: new Date().toLocaleTimeString() }])
    setDeployResult(null)

    // Cycle progress messages while waiting for API
    const progressMsgs = [
      'Provisioning Snowflake connection...',
      'Setting up GitHub repository...',
      'Pushing dbt project files...',
      'Configuring dbt platform...',
      'Creating environments...',
      'Setting up production job...',
      'Finalizing deployment...',
    ]
    let idx = 0
    const progressInterval = setInterval(() => {
      if (idx < progressMsgs.length) {
        setDeployLog([{ msg: progressMsgs[idx], status: 'running', time: new Date().toLocaleTimeString() }])
        idx++
      }
    }, 3000)

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessUrl: dbtAccessUrl, apiToken: dbtApiToken, accountId: dbtAccountId,
          projectName, gitOrg, gitRepo, gitToken,
          sfAccount, sfUser, sfDatabase, sfWarehouse,
          sfPassword: import.meta.env.VITE_SF_PASSWORD || '',
          ghInstallationId: import.meta.env.VITE_GH_INSTALLATION_ID || '',
        }),
      })

      const data = await res.json()
      clearInterval(progressInterval)
      setDeployLog([])

      // Show results one per second
      const allSteps = (data.steps || []).map(s => ({
        msg: formatStep(s.step, s), status: 'done', time: new Date().toLocaleTimeString(),
      }))
      if (!data.success) {
        allSteps.push({ msg: data.error, status: 'error', time: new Date().toLocaleTimeString() })
      }

      for (let i = 0; i < allSteps.length; i++) {
        await new Promise(r => setTimeout(r, 1000))
        setDeployLog(prev => [...prev, allSteps[i]])
      }

      if (data.success) {
        setDeployResult(data)
        setDeployStatus('deployed')
      } else {
        setDeployStatus('error')
      }
    } catch (err) {
      clearInterval(progressInterval)
      setDeployStatus('error')
      setDeployLog([{ msg: err.message, status: 'error', time: new Date().toLocaleTimeString() }])
    }
  }, [dbtAccessUrl, dbtApiToken, dbtAccountId, projectName, gitOrg, gitRepo, gitToken, sfAccount, sfUser, sfDatabase, sfWarehouse])

  const handleDestroy = useCallback(async () => {
    if (!window.confirm(`Destroy all dbt projects named "${projectName}", the GitHub repo, and Snowflake schemas (preserving RAW)?`)) return

    setDestroyStatus('destroying')
    setDeployLog([])

    try {
      const res = await fetch('/api/destroy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessUrl: dbtAccessUrl,
          apiToken: dbtApiToken,
          accountId: dbtAccountId,
          projectName,
          gitOrg,
          gitRepo,
          gitToken,
          sfAccount: import.meta.env.VITE_SF_ACCOUNT || sfAccount,
          sfUser: import.meta.env.VITE_SF_USER || sfUser,
          sfDatabase: import.meta.env.VITE_SF_DATABASE || sfDatabase,
          sfPassword: import.meta.env.VITE_SF_PASSWORD || '',
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDeployStatus('idle')
        setDeployResult(null)
        setDeployLog((data.steps || []).map(s => ({
          msg: s, status: 'done', time: new Date().toLocaleTimeString(),
        })))
        setDestroyStatus('idle')
      } else {
        setDestroyStatus('error')
        setDeployLog([{ msg: data.error, status: 'error', time: new Date().toLocaleTimeString() }])
      }
    } catch (err) {
      setDestroyStatus('error')
      setDeployLog([{ msg: err.message, status: 'error', time: new Date().toLocaleTimeString() }])
    }
  }, [dbtAccessUrl, dbtApiToken, dbtAccountId, projectName, gitOrg, gitRepo, gitToken, sfAccount, sfUser, sfDatabase])

  const warehouseColors = { Snowflake: '#29b5e8', Databricks: '#ff3621', BigQuery: '#4285f4' }
  const cloudColors = { AWS: '#ff9900', Azure: '#0078d4', GCP: '#4285f4' }

  const warehouseFields = warehouse === 'Snowflake' ? (
    <>
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Account" value={sfAccount} onChange={setSfAccount} placeholder="xy12345.us-east-1" mono />
        <TextInput label="Warehouse" value={sfWarehouse} onChange={setSfWarehouse} placeholder="TRANSFORM_WH" mono />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="User" value={sfUser} onChange={setSfUser} placeholder="DBT_USER" mono />
        <TextInput label="Database" value={sfDatabase} onChange={setSfDatabase} placeholder="ANALYTICS" mono />
      </div>
    </>
  ) : warehouse === 'Databricks' ? (
    <>
      <TextInput label="Workspace URL" value={dbxWorkspaceUrl} onChange={setDbxWorkspaceUrl} placeholder="adb-1234567890.1.azuredatabricks.net" mono />
      <TextInput label="HTTP Path" value={dbxHttpPath} onChange={setDbxHttpPath} placeholder="/sql/1.0/warehouses/abc123" mono />
    </>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      <TextInput label="GCP Project" value={bqProject} onChange={setBqProject} placeholder="my-gcp-project" mono />
      <TextInput label="Location" value={bqLocation} onChange={setBqLocation} placeholder="US" mono />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-200">
      {/* Header */}
      <header className="border-b border-dbt-border/50 bg-[#0d0f14]">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DbtLogo />
            <div>
              <h1 className="text-lg font-semibold text-white">dbt Pipeline Generator</h1>
              <p className="text-[11px] text-dbt-muted">Configure parameters to generate a custom data pipeline</p>
            </div>
          </div>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dbt-border text-sm text-dbt-muted hover:text-white hover:border-dbt-muted transition-colors cursor-pointer">
            <Upload size={16} />
            {uploadName || 'Upload Intake Form'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
        </div>
        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex gap-0 border-t border-dbt-border/30">
          {[
            { id: 'architecture', label: 'Acxiom architecture', icon: <Layout size={13} /> },
            { id: 'automation', label: 'Design-to-deploy automation', icon: <Workflow size={13} /> },
            { id: 'generator', label: 'Pipeline Generator', icon: <SlidersHorizontal size={13} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? 'text-dbt-orange border-dbt-orange'
                  : 'text-dbt-muted border-transparent hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'architecture' && <AcxiomArchitecture />}
      {activeTab === 'automation' && <DesignToDeployDiagram />}

      {/* Pipeline Generator */}
      {activeTab === 'generator' && <div className="max-w-[1600px] mx-auto flex" style={{ minHeight: 'calc(100vh - 105px)' }}>
        {/* Left Panel */}
        <div className="w-[35%] min-w-[360px] border-r border-dbt-border/50 p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 65px)' }}>

          <Section title="Project Configuration" icon={<Server size={14} className="text-dbt-muted" />} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-dbt-muted mb-2 uppercase tracking-wider">Infrastructure</label>
                <TextInput label="Project Name" value={projectName} onChange={setProjectName} placeholder="acxiom_client_pipeline" mono />

                <div className="mb-4">
                  <label className="block text-xs font-medium text-dbt-muted mb-2 uppercase tracking-wider">Data Platform</label>
                  <div className="flex gap-2">
                    {WAREHOUSE_OPTIONS.map(opt => {
                      const active = warehouse === opt
                      return (
                        <button key={opt} onClick={() => setWarehouse(opt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer"
                          style={active ? { borderColor: warehouseColors[opt], color: warehouseColors[opt], backgroundColor: warehouseColors[opt] + '15' } : {}}>
                          <WarehouseIcon type={opt} />
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-dbt-muted mb-2 uppercase tracking-wider">Cloud Provider</label>
                  <div className="flex gap-2">
                    {CLOUD_OPTIONS.map(opt => {
                      const active = cloud === opt
                      return (
                        <button key={opt} onClick={() => setCloud(opt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer"
                          style={active ? { borderColor: cloudColors[opt], color: cloudColors[opt], backgroundColor: cloudColors[opt] + '15' } : {}}>
                          <CloudIcon type={opt} />
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {warehouseFields}
              </div>

              <div className="border-t border-dbt-border/30 pt-4">
                <label className="block text-[10px] font-semibold text-dbt-muted mb-2 uppercase tracking-wider">dbt Account</label>
                <TextInput label="Account ID" value={dbtAccountId} onChange={setDbtAccountId} placeholder="12345" mono />
                <TextInput label="Access URL" value={dbtAccessUrl} onChange={setDbtAccessUrl} placeholder="cloud.getdbt.com" mono />
                <TextInput label="API Token" value={dbtApiToken} onChange={setDbtApiToken} placeholder="dbtc_••••••••••" mono secret />
              </div>

              <div className="border-t border-dbt-border/30 pt-4">
                <label className="block text-[10px] font-semibold text-dbt-muted mb-2 uppercase tracking-wider">Git Repository</label>
                <TextInput label="GitHub Organization" value={gitOrg} onChange={setGitOrg} placeholder="acxiom-data" mono />
                <TextInput label="Repository Name" value={gitRepo} onChange={setGitRepo} placeholder="acxiom-client-pipeline" mono />
                <TextInput label="GitHub Token" value={gitToken} onChange={setGitToken} placeholder="ghp_••••••••••" mono secret />
              </div>
            </div>
          </Section>

          <div className="border-t border-dbt-border/50 my-4" />

          <Section title="Pipeline Parameters" icon={<SlidersHorizontal size={14} className="text-dbt-muted" />}>
            <ChipSelect label="Source Types" options={SOURCE_OPTIONS} selected={sources} onChange={setSources} />
            <RadioSelect label="Identity Resolution" options={IDENTITY_OPTIONS} selected={identity} onChange={setIdentity} />
            <RadioSelect label="Data Cleansing" options={CLEANSING_OPTIONS} selected={cleansing} onChange={setCleansing} />
            <ChipSelect label="Audience Outputs" options={AUDIENCE_OPTIONS} selected={audiences} onChange={setAudiences} />
            <RadioSelect label="PII Treatment" options={PII_OPTIONS} selected={pii} onChange={setPii} />
          </Section>

          {/* Config Summary Table */}
          <div className="border-t border-dbt-border/50 pt-4 mt-2">
            <h3 className="text-xs font-semibold text-dbt-muted mb-3 uppercase tracking-wider">Current Configuration</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dbt-border/50">
                  <th className="text-left py-2 text-dbt-muted font-medium">Parameter</th>
                  <th className="text-left py-2 text-dbt-muted font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Project</td><td className="py-1.5 font-mono">{projectName || '\u2014'}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Platform</td><td className="py-1.5">{warehouse} on {cloud}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">dbt Account</td><td className="py-1.5 font-mono">{dbtAccountId || '\u2014'}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Git Repo</td><td className="py-1.5 font-mono">{gitOrg && gitRepo ? `${gitOrg}/${gitRepo}` : '\u2014'}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Sources</td><td className="py-1.5">{sources.join(', ')}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Identity</td><td className="py-1.5">{identity}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Cleansing</td><td className="py-1.5">{cleansing}</td></tr>
                <tr className="border-b border-dbt-border/30"><td className="py-1.5">Audiences</td><td className="py-1.5">{audiences.join(', ')}</td></tr>
                <tr><td className="py-1.5">PII Treatment</td><td className="py-1.5">{pii}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 65px)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white">Generated Pipeline</h2>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.tables}</div>
                <div className="text-[10px] text-dbt-muted uppercase tracking-wider">Models</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.transforms}</div>
                <div className="text-[10px] text-dbt-muted uppercase tracking-wider">Tests</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.marts}</div>
                <div className="text-[10px] text-dbt-muted uppercase tracking-wider">Marts</div>
              </div>
            </div>
          </div>

          {/* Infrastructure badges */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border border-dbt-border text-dbt-muted bg-dbt-card">
              <WarehouseIcon type={warehouse} /> {warehouse}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border border-dbt-border text-dbt-muted bg-dbt-card">
              <CloudIcon type={cloud} /> {cloud}
            </span>
            {projectName && (
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-medium border border-dbt-border text-dbt-muted bg-dbt-card">
                {projectName}
              </span>
            )}
            {gitOrg && gitRepo && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-medium border border-dbt-border text-dbt-muted bg-dbt-card">
                <GitBranch size={12} className="text-dbt-muted" />
                {gitOrg}/{gitRepo}
              </span>
            )}
          </div>

          {/* Pipeline Diagram */}
          <div key={animKey} className="bg-dbt-card border border-dbt-border rounded-xl p-4 mb-6 overflow-hidden">
            <PipelineDiagram sources={sources} stages={stages} audiences={audiences} />
          </div>

          {/* Sample Transformation */}
          <div className="bg-dbt-card border border-dbt-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-dbt-muted uppercase tracking-wider">Sample Transformation</h3>
              <span className="text-[10px] text-dbt-muted px-2 py-0.5 rounded bg-dbt-border/50">
                {cleansing} cleansing &middot; {pii} PII &middot; {warehouse}
              </span>
            </div>
            <pre className="text-xs leading-relaxed text-gray-300 font-mono bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
              <code>{sampleSQL}</code>
            </pre>
          </div>

          {/* Deploy Log */}
          {deployLog.length > 0 && (
            <div className="bg-dbt-card border border-dbt-border rounded-xl p-4 mt-4">
              <h3 className="text-xs font-semibold text-dbt-muted mb-3 uppercase tracking-wider">Deployment Log</h3>
              <div className="space-y-1.5">
                {deployLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono">
                    {entry.status === 'done' && <Check size={12} className="text-green-400 shrink-0" />}
                    {entry.status === 'running' && <Loader2 size={12} className="text-dbt-orange animate-spin shrink-0" />}
                    {entry.status === 'error' && <AlertCircle size={12} className="text-red-400 shrink-0" />}
                    <span className="text-dbt-muted">{entry.time}</span>
                    <span className={entry.status === 'error' ? 'text-red-400' : 'text-gray-300'}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deploy / Destroy Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying' || deployStatus === 'deployed'}
              className={`flex-1 py-3 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors
                ${deployStatus === 'deployed'
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                  : deployStatus === 'deploying'
                    ? 'bg-dbt-orange/50 text-white/70 cursor-wait'
                    : 'bg-dbt-orange text-white hover:bg-[#e55a3a]'
                }
                disabled:cursor-not-allowed`}
            >
              {deployStatus === 'deploying' && <Loader2 size={16} className="animate-spin" />}
              {deployStatus === 'deployed' && <Check size={16} />}
              {deployStatus !== 'deploying' && deployStatus !== 'deployed' && <Send size={16} />}
              {deployStatus === 'deploying' ? 'Deploying...' : deployStatus === 'deployed' ? 'Pipeline Deployed' : 'Deploy Pipeline'}
            </button>

            <button
              onClick={handleDestroy}
              disabled={destroyStatus === 'destroying' || deployStatus === 'deploying'}
              className="px-6 py-3 bg-red-600/20 text-red-400 border border-red-600/30 font-semibold rounded-xl text-sm hover:bg-red-600/30 transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-50"
            >
              {destroyStatus === 'destroying' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {destroyStatus === 'destroying' ? 'Destroying...' : 'Destroy'}
            </button>
          </div>
        </div>
      </div>}
    </div>
  )
}

function formatStep(step, data) {
  const labels = {
    project: `Project created (ID: ${data.id})`,
    connection: `Snowflake connection created (ID: ${data.id})`,
    github_repo: 'GitHub repository created',
    git_push: 'dbt project pushed to GitHub',
    repository: `GitHub repository linked via GitHub App (ID: ${data.id})`,
    project_config: 'Project configured with connection and repository',
    credential: `Snowflake credential created (ID: ${data.id})`,
    environment_prod: `Production environment created (ID: ${data.id})`,
    environment_ci: `CI environment created (ID: ${data.id})`,
    environment_dev: `Development environment created (ID: ${data.id})`,
    job_prod: `Production job created (ID: ${data.id})`,
    job_ci: `CI job created (ID: ${data.id})`,
    job_ci_skip: `CI job skipped: ${data.msg || 'not supported'}`,
  }
  return labels[step] || step
}
