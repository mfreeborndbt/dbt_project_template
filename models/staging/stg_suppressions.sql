with source as (

    select * from {{ source('raw', 'raw_suppressions') }}

),

cleaned as (

    select
        suppression_id,
        lower(trim(email)) as email,
        regexp_replace(phone, '[^0-9]', '') as phone,
        lower(reason) as reason,
        suppressed_at,
        expires_at,
        case
            when expires_at is not null and expires_at < current_timestamp()
            then false
            else true
        end as is_active

    from source
    where suppression_id is not null

)

select * from cleaned
