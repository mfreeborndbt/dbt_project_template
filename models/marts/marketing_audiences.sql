with identity as (

    select * from {{ ref('int_identity_resolution') }}

),

events as (

    select * from {{ ref('int_customer_events_aggregated') }}

),

suppressions as (

    select * from {{ ref('int_suppression_check') }}

),

states as (

    select * from {{ ref('stg_reference_states') }}

),

marketing_eligible as (

    select
        {{ dbt_utils.generate_surrogate_key(['i.customer_id']) }} as audience_member_id,
        i.customer_id,
        i.first_name,
        i.last_name,
        i.email,
        i.phone,
        i.city,
        i.state_code,
        s.state_name,
        s.region,
        i.zip_code,
        i.loyalty_tier,
        i.preferred_channel,
        i.lifetime_order_count,
        i.lifetime_spend,
        i.lead_source,
        i.lead_score,
        coalesce(e.total_purchases, 0) as total_purchases,
        coalesce(e.total_event_revenue, 0) as total_event_revenue,
        coalesce(e.email_opens, 0) as email_opens,
        coalesce(e.email_clicks, 0) as email_clicks,
        e.last_event_at,
        case
            when i.loyalty_tier = 'platinum' then 'vip'
            when i.loyalty_tier = 'gold' then 'high_value'
            when coalesce(e.total_purchases, 0) >= 3 then 'active_buyer'
            when coalesce(e.email_clicks, 0) >= 2 then 'engaged'
            else 'standard'
        end as audience_segment

    from identity i
    left join events e on i.customer_id = e.customer_id
    left join states s on i.state_code = s.state_code
    left join suppressions sup on i.email = sup.suppressed_email
    where i.email is not null
      and sup.suppressed_email is null

)

select * from marketing_eligible
