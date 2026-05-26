with identity as (

    select * from {{ ref('int_identity_resolution') }}

),

events as (

    select * from {{ ref('int_customer_events_aggregated') }}

),

states as (

    select * from {{ ref('stg_reference_states') }}

),

enriched_profiles as (

    select
        {{ dbt_utils.generate_surrogate_key(['i.customer_id']) }} as profile_id,
        i.customer_id,
        i.first_name,
        i.last_name,
        i.email,
        i.state_code,
        s.state_name,
        s.region,
        i.date_of_birth,
        datediff('year', i.date_of_birth, current_date()) as age,
        i.loyalty_tier,
        i.lifetime_order_count,
        i.lifetime_spend,
        i.preferred_channel,
        i.source_system,
        i.match_type as identity_match_type,
        i.lead_source,
        i.lead_score,
        i.estimated_household_income,

        -- Event metrics
        coalesce(e.total_events, 0) as total_events,
        coalesce(e.distinct_event_types, 0) as distinct_event_types,
        coalesce(e.distinct_channels, 0) as distinct_channels,
        coalesce(e.total_purchases, 0) as total_purchases,
        coalesce(e.total_event_revenue, 0) as total_event_revenue,
        coalesce(e.product_views, 0) as product_views,
        coalesce(e.add_to_carts, 0) as add_to_carts,
        coalesce(e.checkouts_started, 0) as checkouts_started,
        coalesce(e.return_requests, 0) as return_requests,
        coalesce(e.email_opens, 0) as email_opens,
        coalesce(e.email_clicks, 0) as email_clicks,
        e.most_frequent_product_category,
        coalesce(e.distinct_campaigns_touched, 0) as distinct_campaigns_touched,

        -- Derived metrics
        case
            when coalesce(e.product_views, 0) > 0
            then round(coalesce(e.total_purchases, 0)::float / e.product_views, 4)
            else 0
        end as view_to_purchase_rate,

        case
            when coalesce(e.email_opens, 0) > 0
            then round(coalesce(e.email_clicks, 0)::float / e.email_opens, 4)
            else 0
        end as email_click_through_rate,

        e.first_event_at,
        e.last_event_at,
        i.created_at as customer_since

    from identity i
    left join events e on i.customer_id = e.customer_id
    left join states s on i.state_code = s.state_code

)

select * from enriched_profiles
