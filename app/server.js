import express from 'express'
import cors from 'cors'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3001
const PROJECT_ROOT = join(fileURLToPath(import.meta.url), '../..')

// Helper to call dbt platform Admin API
async function dbtApi(method, path, token, body = null) {
  const opts = {
    method,
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`https://${path}`, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) {
    const errMsg = data?.status?.user_message || data?.status?.developer_message || data?.detail || data?.data || text.slice(0, 200)
    throw new Error(`dbt API ${method} failed (${res.status}): ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`)
  }
  return data
}

// Helper to call GitHub API
async function ghApi(method, path, token, body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`https://api.github.com${path}`, opts)
  if (method === 'DELETE' && res.status === 204) return { ok: true }
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    throw new Error(`GitHub API ${method} ${path} failed (${res.status}): ${data?.message || text.slice(0, 200)}`)
  }
  data._status = res.status
  return data
}

// Collect all dbt project files to push to GitHub
function collectDbtFiles() {
  const files = []
  const dirs = ['models', 'macros', 'snapshots', 'analyses', 'tests']
  const rootFiles = ['dbt_project.yml', 'packages.yml']

  for (const f of rootFiles) {
    try {
      const content = readFileSync(join(PROJECT_ROOT, f), 'utf-8')
      files.push({ path: f, content })
    } catch { /* skip if missing */ }
  }

  for (const dir of dirs) {
    const dirPath = join(PROJECT_ROOT, dir)
    try {
      walkDir(dirPath, dirPath, files)
    } catch { /* skip if missing */ }
  }
  return files
}

function walkDir(base, dir, files) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkDir(base, full, files)
    } else {
      const relPath = relative(PROJECT_ROOT, full)
      files.push({ path: relPath, content: readFileSync(full, 'utf-8') })
    }
  }
}

// Push files to GitHub via the Contents API (tree + commit)
async function pushFilesToGitHub(gitOrg, gitRepo, gitToken, files) {
  const repo = `${gitOrg}/${gitRepo}`

  // Get the default branch ref
  const refData = await ghApi('GET', `/repos/${repo}/git/ref/heads/main`, gitToken)
  const latestSha = refData.object.sha

  // Create blobs for each file
  const tree = []
  for (const f of files) {
    const blob = await ghApi('POST', `/repos/${repo}/git/blobs`, gitToken, {
      content: Buffer.from(f.content).toString('base64'),
      encoding: 'base64',
    })
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
  }

  // Create tree
  const treeRes = await ghApi('POST', `/repos/${repo}/git/trees`, gitToken, {
    base_tree: latestSha,
    tree,
  })

  // Create commit
  const commitRes = await ghApi('POST', `/repos/${repo}/git/commits`, gitToken, {
    message: 'Deploy dbt project from Pipeline Generator',
    tree: treeRes.sha,
    parents: [latestSha],
  })

  // Update ref
  await ghApi('PATCH', `/repos/${repo}/git/refs/heads/main`, gitToken, {
    sha: commitRes.sha,
  })
}

// POST /api/deploy
app.post('/api/deploy', async (req, res) => {
  const {
    accessUrl, apiToken, accountId,
    projectName, gitOrg, gitRepo, gitToken,
    sfAccount, sfUser, sfDatabase, sfWarehouse, sfPassword, ghInstallationId,
  } = req.body

  const base = `${accessUrl}/api`
  const aid = Number(accountId)
  const steps = []

  try {
    // 1. Create dbt project
    const projRes = await dbtApi('POST', `${base}/v2/accounts/${aid}/projects/`, apiToken, {
      name: projectName, account_id: aid,
    })
    const projectId = projRes.data.id
    steps.push({ step: 'project', id: projectId })

    // 2. Create Snowflake connection
    const connRes = await dbtApi('POST', `${base}/v3/accounts/${aid}/connections/`, apiToken, {
      name: `${projectName} | Snowflake`,
      account_id: aid,
      adapter_version: 'snowflake_v0',
      config: {
        account: sfAccount, database: sfDatabase, warehouse: sfWarehouse,
        role: 'TRANSFORMER', client_session_keep_alive: true,
      },
    })
    const connectionId = connRes.data.id
    steps.push({ step: 'connection', id: connectionId })

    // 3. Create GitHub repo (or ensure it exists)
    const repoCheck = await ghApi('GET', `/repos/${gitOrg}/${gitRepo}`, gitToken)
    if (repoCheck._status === 404) {
      const userCheck = await ghApi('GET', `/users/${gitOrg}`, gitToken)
      const createUrl = userCheck.type === 'Organization'
        ? `/orgs/${gitOrg}/repos` : '/user/repos'
      await ghApi('POST', createUrl, gitToken, { name: gitRepo, private: true, auto_init: true })
      // Wait for GitHub to initialize the repo
      await new Promise(r => setTimeout(r, 2000))
    }
    steps.push({ step: 'github_repo' })

    // 4. Push dbt project files to GitHub
    const dbtFiles = collectDbtFiles()
    await pushFilesToGitHub(gitOrg, gitRepo, gitToken, dbtFiles)
    steps.push({ step: 'git_push' })

    // 5. Link repository in dbt platform via GitHub App
    const repoRes = await dbtApi('POST', `${base}/v2/accounts/${aid}/repositories/`, apiToken, {
      remote_url: `git://github.com/${gitOrg}/${gitRepo}.git`,
      git_clone_strategy: 'github_app',
      github_installation_id: Number(ghInstallationId),
      project_id: projectId,
    })
    const repositoryId = repoRes.data.id
    steps.push({ step: 'repository', id: repositoryId })

    // 6. Configure project with connection + repo
    await dbtApi('POST', `${base}/v2/accounts/${aid}/projects/${projectId}/`, apiToken, {
      id: projectId, name: projectName, account_id: aid,
      connection_id: connectionId, repository_id: repositoryId,
    })
    steps.push({ step: 'project_config' })

    // 7. Create Snowflake credential (production schema)
    const credRes = await dbtApi('POST', `${base}/v3/accounts/${aid}/projects/${projectId}/credentials/`, apiToken, {
      account_id: aid, project_id: projectId,
      type: 'snowflake', state: 1, schema: 'production',
      user: sfUser, password: sfPassword, auth_type: 'password', threads: 4,
    })
    const credentialId = credRes.data.id
    steps.push({ step: 'credential', id: credentialId })

    // 8. Create Production environment
    const prodEnvRes = await dbtApi('POST', `${base}/v3/accounts/${aid}/environments/`, apiToken, {
      project_id: projectId, account_id: aid,
      name: 'Production', type: 'deployment', deployment_type: 'production',
      dbt_version: 'latest-fusion', connection_id: connectionId, credentials_id: credentialId,
    })
    const prodEnvId = prodEnvRes.data.id
    steps.push({ step: 'environment_prod', id: prodEnvId })

    // 9. Create CI credential (ci schema)
    const ciCredRes = await dbtApi('POST', `${base}/v3/accounts/${aid}/projects/${projectId}/credentials/`, apiToken, {
      account_id: aid, project_id: projectId,
      type: 'snowflake', state: 1, schema: 'ci',
      user: sfUser, password: sfPassword, auth_type: 'password', threads: 4,
    })
    const ciCredentialId = ciCredRes.data.id

    // 10. Create CI environment
    const ciEnvRes = await dbtApi('POST', `${base}/v3/accounts/${aid}/environments/`, apiToken, {
      project_id: projectId, account_id: aid,
      name: 'CI', type: 'deployment',
      dbt_version: 'latest-fusion', connection_id: connectionId, credentials_id: ciCredentialId,
    })
    const ciEnvId = ciEnvRes.data.id
    steps.push({ step: 'environment_ci', id: ciEnvId })

    // 11. Create Development environment
    const devEnvRes = await dbtApi('POST', `${base}/v3/accounts/${aid}/environments/`, apiToken, {
      project_id: projectId, account_id: aid,
      name: 'Development', type: 'development',
      dbt_version: 'latest-fusion', connection_id: connectionId,
    })
    const devEnvId = devEnvRes.data.id
    steps.push({ step: 'environment_dev', id: devEnvId })

    // 12. Create Production job
    const jobRes = await dbtApi('POST', `${base}/v2/accounts/${aid}/jobs/`, apiToken, {
      project_id: projectId, account_id: aid, environment_id: prodEnvId,
      name: `${projectName} | Production Run`,
      execute_steps: ['dbt build'],
      generate_docs: true, run_generate_sources: true,
      triggers: { github_webhook: false, git_provider_webhook: false, schedule: false, on_merge: false },
      settings: { threads: 4, target_name: 'default' },
    })
    const jobId = jobRes.data.id
    steps.push({ step: 'job_prod', id: jobId })

    // 13. Create CI job
    let ciJobId = null
    try {
      const ciJobRes = await dbtApi('POST', `${base}/v2/accounts/${aid}/jobs/`, apiToken, {
        project_id: projectId, account_id: aid, environment_id: ciEnvId,
        name: `${projectName} | CI Check`,
        execute_steps: ['dbt build --select state:modified+'],
        generate_docs: false, run_generate_sources: false,
        triggers: { github_webhook: true, git_provider_webhook: false, schedule: false, on_merge: false },
        settings: { threads: 4, target_name: 'default' },
      })
      ciJobId = ciJobRes.data.id
      steps.push({ step: 'job_ci', id: ciJobId })
    } catch (e) {
      steps.push({ step: 'job_ci_skip', msg: e.message })
    }

    res.json({ success: true, projectId, prodEnvId, ciEnvId, devEnvId, jobId, ciJobId, connectionId, repositoryId, steps })
  } catch (err) {
    console.error('Deploy error:', err.message)
    res.status(500).json({ success: false, error: err.message, steps })
  }
})

// POST /api/destroy — find and delete all matching projects, GitHub repo, and Snowflake schemas
app.post('/api/destroy', async (req, res) => {
  const {
    accessUrl, apiToken, accountId, projectName,
    gitOrg, gitRepo, gitToken,
    sfAccount, sfUser, sfDatabase, sfPassword,
  } = req.body
  const base = `${accessUrl}/api`
  const aid = Number(accountId)
  const steps = []

  try {
    // 1. Find and delete all dbt projects with matching name
    const projList = await dbtApi('GET', `${base}/v2/accounts/${aid}/projects/`, apiToken)
    const matching = projList.data.filter(p => p.name === projectName)
    for (const p of matching) {
      await dbtApi('DELETE', `${base}/v2/accounts/${aid}/projects/${p.id}/`, apiToken)
      steps.push(`Deleted dbt project ${p.id}`)
    }
    if (matching.length === 0) steps.push('No matching dbt projects found')

    // 2. Clean up orphaned connections with matching name
    const connList = await dbtApi('GET', `${base}/v3/accounts/${aid}/connections/`, apiToken)
    const matchConns = connList.data.filter(c => c.name.includes(projectName))
    for (const c of matchConns) {
      try {
        await dbtApi('DELETE', `${base}/v3/accounts/${aid}/connections/${c.id}/`, apiToken)
        steps.push(`Deleted connection ${c.id}`)
      } catch { /* skip */ }
    }

    // 3. Delete GitHub repo
    if (gitOrg && gitRepo && gitToken) {
      const delRes = await ghApi('DELETE', `/repos/${gitOrg}/${gitRepo}`, gitToken)
      if (delRes.ok) {
        steps.push(`Deleted GitHub repo ${gitOrg}/${gitRepo}`)
      } else {
        steps.push('GitHub repo not found or already deleted')
      }
    }

    // 4. Drop non-RAW schemas in Snowflake
    if (sfAccount && sfUser && sfPassword && sfDatabase) {
      try {
        const snowflake = await import('snowflake-sdk')
        const conn = snowflake.default.createConnection({
          account: sfAccount, username: sfUser, password: sfPassword, database: sfDatabase,
        })
        await new Promise((resolve, reject) => conn.connect((err) => err ? reject(err) : resolve()))

        const schemas = await new Promise((resolve, reject) => {
          conn.execute({
            sqlText: `SHOW SCHEMAS IN DATABASE ${sfDatabase}`,
            complete: (err, stmt, rows) => err ? reject(err) : resolve(rows),
          })
        })

        const protectedSchemas = ['RAW', 'INFORMATION_SCHEMA', 'PUBLIC']
        for (const s of schemas) {
          const schemaName = s.name
          if (!protectedSchemas.includes(schemaName.toUpperCase())) {
            await new Promise((resolve, reject) => {
              conn.execute({
                sqlText: `DROP SCHEMA IF EXISTS ${sfDatabase}.${schemaName} CASCADE`,
                complete: (err) => err ? reject(err) : resolve(),
              })
            })
            steps.push(`Dropped Snowflake schema ${schemaName}`)
          }
        }
        conn.destroy()
      } catch (e) {
        steps.push(`Snowflake cleanup skipped: ${e.message}`)
      }
    }

    res.json({ success: true, steps })
  } catch (err) {
    console.error('Destroy error:', err.message)
    res.status(500).json({ success: false, error: err.message, steps })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
