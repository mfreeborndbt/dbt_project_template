with source as (

    select * from {{ source('raw', 'raw_customers') }}

),

cleaned as (

    select
        customer_id,
        trim(first_name) as first_name,
        trim(last_name) as last_name,
        lower(trim(email)) as email,
        regexp_replace(phone, '[^0-9]', '') as phone,
        trim(street_address) as street_address,
        trim(city) as city,
        upper(trim(state_code)) as state_code,
        trim(zip_code) as zip_code,
        date_of_birth,
        lower(loyalty_tier) as loyalty_tier,
        lifetime_order_count,
        lifetime_spend,
        lower(preferred_channel) as preferred_channel,
        created_at,
        updated_at,
        lower(source_system) as source_system

    from source
    where customer_id is not null

)

select * from cleaned
