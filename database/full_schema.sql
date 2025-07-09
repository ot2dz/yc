-- =================================================================
--  YCFApp - Full Database Schema (Single-User Version)
--  This script sets up all tables and relationships for a fresh,
--  single-user database. RLS policies are removed.
-- =================================================================

-- == EXTENSIONS ==
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
--  TABLE: customers
-- =================================================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
COMMENT ON TABLE public.customers IS 'Stores customer information.';

-- =================================================================
--  TABLE: debts
-- =================================================================
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    reminder_date TIMESTAMPTZ,
    last_reminder_sent TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);
COMMENT ON TABLE public.debts IS 'Stores individual debt records for customers.';
-- Index for performance
CREATE INDEX idx_debts_customer_id ON public.debts(customer_id);

-- =================================================================
--  TABLE: payments
-- =================================================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);
COMMENT ON TABLE public.payments IS 'Stores individual payment transactions for each debt.';
-- Index for performance
CREATE INDEX idx_payments_debt_id ON public.payments(debt_id);

-- =================================================================
--  VIEW: customer_summary
-- =================================================================
DROP VIEW IF EXISTS public.customer_summary;

CREATE OR REPLACE VIEW public.customer_summary AS
SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    COALESCE(SUM(d.amount), 0) AS total_debt_amount,
    COALESCE(
        (SELECT SUM(p.amount) FROM public.payments p WHERE p.debt_id IN (SELECT id FROM public.debts WHERE customer_id = c.id)), 0
    ) AS total_paid_amount,
    (COALESCE(SUM(d.amount), 0) - COALESCE(
        (SELECT SUM(p.amount) FROM public.payments p WHERE p.debt_id IN (SELECT id FROM public.debts WHERE customer_id = c.id)), 0
    )) AS remaining_balance,
    COUNT(d.id) FILTER (WHERE d.is_paid = false) AS unpaid_debts_count,
    COUNT(d.id) AS total_debts_count
FROM
    public.customers c
LEFT JOIN
    public.debts d ON c.id = d.customer_id
WHERE
    c.deleted_at IS NULL
GROUP BY
    c.id, c.name, c.phone;

COMMENT ON VIEW public.customer_summary IS 'A calculated, real-time financial summary for each customer.';

-- =================================================================
--  END OF SCRIPT
-- =================================================================