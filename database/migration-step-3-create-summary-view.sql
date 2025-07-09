-- الخطوة 3: إنشاء "عرض" (View) لحساب ملخصات الديون تلقائياً

-- حذف العرض إذا كان موجوداً لتسهيل إعادة التشغيل
DROP VIEW IF EXISTS public.customer_summary;

CREATE OR REPLACE VIEW public.customer_summary AS
SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.user_id,
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
GROUP BY
    c.id, c.name, c.phone, c.user_id;

-- إضافة تعليقات توضيحية
COMMENT ON VIEW public.customer_summary IS 'عرض ملخص مالي لكل عميل، يتم حسابه تلقائياً من جداول الديون والمدفوعات.';
COMMENT ON COLUMN public.customer_summary.customer_id IS 'معرف العميل';
COMMENT ON COLUMN public.customer_summary.total_debt_amount IS 'إجمالي مبلغ الديون الأصلية للعميل.';
COMMENT ON COLUMN public.customer_summary.total_paid_amount IS 'إجمالي المبلغ الذي دفعه العميل عبر جميع ديونه.';
COMMENT ON COLUMN public.customer_summary.remaining_balance IS 'المبلغ المتبقي على العميل (إجمالي الديون - إجمالي المدفوعات).';
COMMENT ON COLUMN public.customer_summary.unpaid_debts_count IS 'عدد الديون التي لم يتم تسديدها بالكامل بعد.';
COMMENT ON COLUMN public.customer_summary.total_debts_count IS 'إجمالي عدد الديون المسجلة للعميل.';

-- ملاحظة: لا يمكنك تطبيق سياسات RLS مباشرة على العرض، لكنه سيحترم سياسات الجداول الأساسية
-- تأكد من أن سياسات RLS على `customers` و `debts` صحيحة.
