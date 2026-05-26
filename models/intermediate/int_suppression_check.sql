with suppressions as (

    select * from {{ ref('stg_suppressions') }}
    where is_active = true

),

-- Deduplicate to one active suppression per email (keep most recent)
deduplicated as (

    select
        email,
        phone,
        reason,
        suppressed_at,
        expires_at,
        row_number() over (
            partition by email
            order by suppressed_at desc
        ) as row_num

    from suppressions

),

active_suppressions as (

    select
        email as suppressed_email,
        phone as suppressed_phone,
        reason as suppression_reason,
        suppressed_at,
        expires_at as suppression_expires_at

    from deduplicated
    where row_num = 1

)

select * from active_suppressions
