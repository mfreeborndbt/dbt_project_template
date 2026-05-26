with source as (

    select * from {{ source('raw', 'raw_prospects') }}

),

cleaned as (

    select
        prospect_id,
        trim(first_name) as first_name,
        trim(last_name) as last_name,
        lower(trim(email)) as email,
        regexp_replace(phone, '[^0-9]', '') as phone,
        trim(street_address) as street_address,
        trim(city) as city,
        upper(trim(state_code)) as state_code,
        trim(zip_code) as zip_code,
        lower(lead_source) as lead_source,
        lead_score,
        estimated_household_income,
        created_at

    from source
    where prospect_id is not null

)

select * from cleaned
