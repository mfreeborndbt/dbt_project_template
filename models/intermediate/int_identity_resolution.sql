with customers as (

    select * from {{ ref('stg_customers') }}

),

prospects as (

    select * from {{ ref('stg_prospects') }}

),

-- Match prospects to customers on email OR (name + address)
matched_prospects as (

    select
        p.prospect_id,
        coalesce(email_match.customer_id, name_match.customer_id) as matched_customer_id,
        case
            when email_match.customer_id is not null then 'email'
            when name_match.customer_id is not null then 'name_address'
            else null
        end as match_type
    from prospects p
    left join customers email_match
        on p.email = email_match.email
        and p.email is not null
        and email_match.email is not null
    left join customers name_match
        on lower(trim(p.first_name)) = lower(trim(name_match.first_name))
        and lower(p.last_name) = lower(name_match.last_name)
        and p.street_address = name_match.street_address
        and email_match.customer_id is null

),

-- Build unified identity with customer as the anchor
unified as (

    select
        {{ dbt_utils.generate_surrogate_key(['c.customer_id']) }} as identity_id,
        c.customer_id,
        mp.prospect_id,
        mp.match_type,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.street_address,
        c.city,
        c.state_code,
        c.zip_code,
        c.date_of_birth,
        c.loyalty_tier,
        c.lifetime_order_count,
        c.lifetime_spend,
        c.preferred_channel,
        c.source_system,
        -- Enrich with prospect data when matched
        p.lead_source,
        p.lead_score,
        p.estimated_household_income,
        c.created_at,
        c.updated_at

    from customers c
    left join matched_prospects mp
        on c.customer_id = mp.matched_customer_id
    left join prospects p
        on mp.prospect_id = p.prospect_id

)

select * from unified
