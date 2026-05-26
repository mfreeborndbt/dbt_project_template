with source as (

    select * from {{ source('raw', 'raw_reference_states') }}

),

cleaned as (

    select
        upper(trim(state_code)) as state_code,
        trim(state_name) as state_name,
        lower(trim(region)) as region

    from source
    where state_code is not null

)

select * from cleaned
