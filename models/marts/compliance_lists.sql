with suppressions as (

    select * from {{ ref('stg_suppressions') }}

),

customers as (

    select * from {{ ref('stg_customers') }}

),

prospects as (

    select * from {{ ref('stg_prospects') }}

),

compliance_records as (

    select
        sup.suppression_id,
        sup.email,
        sup.phone,
        sup.reason,
        sup.suppressed_at,
        sup.expires_at,
        sup.is_active,
        case
            when c.customer_id is not null then 'customer'
            when p.prospect_id is not null then 'prospect'
            else 'unknown'
        end as record_source,
        c.customer_id,
        p.prospect_id,
        coalesce(c.first_name, p.first_name) as first_name,
        coalesce(c.last_name, p.last_name) as last_name,
        case
            when sup.reason in ('fraud_flag', 'spam_complaint') then 'high'
            when sup.reason in ('hard_bounce', 'customer_request') then 'medium'
            else 'low'
        end as suppression_severity

    from suppressions sup
    left join customers c on sup.email = c.email
    left join prospects p on sup.email = p.email
        and c.customer_id is null

)

select * from compliance_records
