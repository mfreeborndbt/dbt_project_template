with events as (

    select * from {{ ref('stg_events') }}

),

aggregated as (

    select
        customer_id,

        -- Overall engagement
        count(*) as total_events,
        count(distinct event_type) as distinct_event_types,
        count(distinct channel) as distinct_channels,
        min(event_timestamp) as first_event_at,
        max(event_timestamp) as last_event_at,

        -- Purchase metrics
        count(case when event_type = 'purchase' then 1 end) as total_purchases,
        coalesce(sum(event_revenue), 0) as total_event_revenue,

        -- Funnel metrics
        count(case when event_type = 'product_view' then 1 end) as product_views,
        count(case when event_type = 'add_to_cart' then 1 end) as add_to_carts,
        count(case when event_type = 'begin_checkout' then 1 end) as checkouts_started,
        count(case when event_type = 'return_request' then 1 end) as return_requests,

        -- Engagement metrics
        count(case when event_type = 'email_open' then 1 end) as email_opens,
        count(case when event_type = 'email_click' then 1 end) as email_clicks,
        count(case when event_type = 'wishlist_add' then 1 end) as wishlist_adds,

        -- Channel breakdown
        count(case when channel = 'web' then 1 end) as web_events,
        count(case when channel = 'mobile_app' then 1 end) as mobile_events,
        count(case when channel = 'in_store' then 1 end) as in_store_events,

        -- Top product category
        mode(product_category) as most_frequent_product_category,

        -- Campaign engagement
        count(distinct campaign_id) as distinct_campaigns_touched

    from events
    group by customer_id

)

select * from aggregated
