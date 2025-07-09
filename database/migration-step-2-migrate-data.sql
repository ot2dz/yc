-- الخطوة 2: هجرة البيانات من حقل `payments` القديم إلى جدول `payments` الجديد
-- قم بتشغيل هذا السكربت بعد إنشاء جدول `payments`

DO $$
DECLARE
    debt_record RECORD;
    payment_json JSONB;
BEGIN
    -- المرور على كل دين في جدول الديون
    FOR debt_record IN
        SELECT id, payments, user_id FROM public.debts WHERE jsonb_array_length(payments::jsonb) > 0
    LOOP
        -- المرور على كل دفعة موجودة في حقل `payments`
        FOR payment_json IN
            SELECT * FROM jsonb_array_elements(debt_record.payments::jsonb)
        LOOP
            -- إدخال سجل جديد في جدول `payments`
            INSERT INTO public.payments (debt_id, amount, created_at, notes, user_id)
            VALUES (
                debt_record.id,
                (payment_json->>'amount')::NUMERIC,
                TO_TIMESTAMP((payment_json->>'date')::BIGINT / 1000), -- تحويل من ميلي ثانية إلى تاريخ
                payment_json->>'notes',
                debt_record.user_id
            );
        END LOOP;
    END LOOP;
END $$;

-- ملاحظة: بعد التأكد من نجاح الهجرة، يمكنك حذف حقل `payments` من جدول `debts` لاحقاً
-- ALTER TABLE public.debts DROP COLUMN payments;
