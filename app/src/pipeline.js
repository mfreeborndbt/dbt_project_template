export function getTransformationStages(identity, cleansing, pii) {
  const stages = []
  if (identity === 'Basic') {
    stages.push({ id: 'id_match', label: 'Identity Match', color: '#3b82f6' })
  } else if (identity === 'Standard') {
    stages.push({ id: 'id_match', label: 'Identity Match', color: '#3b82f6' })
    stages.push({ id: 'id_enrich', label: 'Profile Enrichment', color: '#6366f1' })
    stages.push({ id: 'id_link', label: 'Household Linking', color: '#8b5cf6' })
  } else {
    stages.push({ id: 'id_match', label: 'Identity Match', color: '#3b82f6' })
    stages.push({ id: 'id_graph', label: 'Identity Graph', color: '#6366f1' })
    stages.push({ id: 'id_household', label: 'Household Resolution', color: '#8b5cf6' })
    stages.push({ id: 'id_address', label: 'Address Resolution', color: '#a78bfa' })
    stages.push({ id: 'id_enrich', label: 'Full Enrichment', color: '#c084fc' })
  }
  const cleanseColors = { Light: '#22c55e', Standard: '#eab308', Strict: '#ef4444' }
  stages.push({ id: 'cleanse', label: `${cleansing} Cleansing`, color: cleanseColors[cleansing] })
  const piiColors = { Standard: '#06b6d4', Masked: '#f97316', Tokenized: '#ec4899' }
  stages.push({ id: 'pii', label: `PII ${pii}`, color: piiColors[pii] })
  return stages
}

export function getStats(sources, stages, audiences) {
  const srcCount = sources.length
  const stageCount = stages.length
  const audCount = audiences.length
  const tables = srcCount * 2 + stageCount + audCount * 2
  const transforms = stageCount + Math.max(1, srcCount - 1) + audCount
  return { tables, transforms, marts: audCount }
}

export function getSampleSQL(cleansing, pii) {
  if (cleansing === 'Light' && pii === 'Standard') {
    return `select
    customer_id,
    email,
    first_name,
    last_name,
    phone
from {{ ref('stg_customers') }}
where email is not null`
  }
  if (cleansing === 'Strict' && pii === 'Tokenized') {
    return `select
    {{ dbt_utils.generate_surrogate_key(['customer_id']) }}
        as token_id,
    {{ pii_tokenize('email') }} as email_token,
    upper(trim(first_name)) as first_name,
    {{ validate_phone('phone') }} as phone,
    {{ address_standardize('address') }} as address
from {{ ref('stg_customers') }}
where {{ is_valid_record('customer_id', 'email') }}`
  }
  if (pii === 'Tokenized') {
    return `select
    {{ dbt_utils.generate_surrogate_key(['customer_id']) }}
        as token_id,
    {{ pii_tokenize('email') }} as email_token,
    trim(first_name) as first_name,
    phone
from {{ ref('stg_customers') }}
where email is not null`
  }
  if (pii === 'Masked') {
    return `select
    customer_id,
    {{ pii_mask('email', 3) }} as email_masked,
    first_name,
    {{ pii_mask('phone', 4) }} as phone_masked
from {{ ref('stg_customers') }}
where email is not null`
  }
  if (cleansing === 'Strict') {
    return `select
    customer_id,
    lower(trim(email)) as email,
    upper(trim(first_name)) as first_name,
    {{ validate_phone('phone') }} as phone,
    {{ address_standardize('address') }} as address
from {{ ref('stg_customers') }}
where {{ is_valid_record('customer_id', 'email') }}`
  }
  return `select
    customer_id,
    lower(trim(email)) as email,
    trim(first_name) as first_name,
    last_name,
    phone
from {{ ref('stg_customers') }}
where email is not null`
}
