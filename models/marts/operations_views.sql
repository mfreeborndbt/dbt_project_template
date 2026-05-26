with customers as (

    select * from {{ ref('stg_customers') }}

),

prospects as (

    select * from {{ ref('stg_prospects') }}

),

events as (

    select * from {{ ref('stg_events') }}

),

suppressions as (

    select * from {{ ref('stg_suppressions') }}

),

customer_quality as (

    select
        'customers' as source_table,
        count(*) as total_records,
        count(email) as non_null_emails,
        round(count(email)::float / count(*) * 100, 1) as email_fill_rate_pct,
        count(phone) as non_null_phones,
        round(count(phone)::float / count(*) * 100, 1) as phone_fill_rate_pct,
        count(distinct loyalty_tier) as distinct_tiers,
        max(updated_at) as last_updated_at,
        min(created_at) as earliest_record,
        max(created_at) as latest_record
    from customers

),

prospect_quality as (

    select
        'prospects' as source_table,
        count(*) as total_records,
        count(email) as non_null_emails,
        round(count(email)::float / count(*) * 100, 1) as email_fill_rate_pct,
        count(phone) as non_null_phones,
        round(count(phone)::float / count(*) * 100, 1) as phone_fill_rate_pct,
        count(distinct lead_source) as distinct_tiers,
        max(created_at) as last_updated_at,
        min(created_at) as earliest_record,
        max(created_at) as latest_record
    from prospects

),

event_quality as (

    select
        'events' as source_table,
        count(*) as total_records,
        count(customer_id) as non_null_emails,
        round(count(customer_id)::float / count(*) * 100, 1) as email_fill_rate_pct,
        count(campaign_id) as non_null_phones,
        round(count(campaign_id)::float / count(*) * 100, 1) as phone_fill_rate_pct,
        count(distinct event_type) as distinct_tiers,
        max(event_timestamp) as last_updated_at,
        min(event_timestamp) as earliest_record,
        max(event_timestamp) as latest_record
    from events

),

suppression_quality as (

    select
        'suppressions' as source_table,
        count(*) as total_records,
        count(email) as non_null_emails,
        round(count(email)::float / count(*) * 100, 1) as email_fill_rate_pct,
        count(phone) as non_null_phones,
        round(count(phone)::float / count(*) * 100, 1) as phone_fill_rate_pct,
        count(distinct reason) as distinct_tiers,
        max(suppressed_at) as last_updated_at,
        min(suppressed_at) as earliest_record,
        max(suppressed_at) as latest_record
    from suppressions

),

combined as (

    select * from customer_quality
    union all
    select * from prospect_quality
    union all
    select * from event_quality
    union all
    select * from suppression_quality

)

select
    source_table,
    total_records,
    non_null_emails as primary_field_populated,
    email_fill_rate_pct as primary_field_fill_rate_pct,
    non_null_phones as secondary_field_populated,
    phone_fill_rate_pct as secondary_field_fill_rate_pct,
    distinct_tiers as distinct_categories,
    last_updated_at as data_freshness_at,
    earliest_record,
    latest_record

from combined
