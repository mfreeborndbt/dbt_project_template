with source as (

    select * from {{ source('raw', 'raw_events') }}

),

cleaned as (

    select
        event_id,
        customer_id,
        lower(event_type) as event_type,
        event_timestamp,
        lower(channel) as channel,
        nullif(trim(campaign_id), '') as campaign_id,
        nullif(lower(trim(product_category)), '') as product_category,
        event_revenue

    from source
    where event_id is not null

)

select * from cleaned
