-- الخطوة 1: إنشاء جدول جديد لتخزين المدفوعات بشكل منفصل

-- التأكد من تفعيل امتداد UUID إذا لم يكن مفعلاً
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إنشاء جدول المدفوعات `payments`
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,

    -- إضافة مُعرّف المستخدم لسياسات RLS
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- إضافة تعليقات توضيحية للجدول والحقول
COMMENT ON TABLE public.payments IS 'يحتوي على جميع عمليات الدفع الفردية لكل دين.';
COMMENT ON COLUMN public.payments.id IS 'المعرف الفريد للدفعة (UUID)';
COMMENT ON COLUMN public.payments.debt_id IS 'يشير إلى الدين الذي تنتمي إليه هذه الدفعة.';
COMMENT ON COLUMN public.payments.amount IS 'مبلغ الدفعة.';
COMMENT ON COLUMN public.payments.created_at IS 'تاريخ ووقت تسجيل الدفعة.';
COMMENT ON COLUMN public.payments.notes IS 'ملاحظات إضافية حول الدفعة.';
COMMENT ON COLUMN public.payments.user_id IS 'معرف المستخدم الذي قام بالعملية.';

-- تفعيل سياسات الأمان على مستوى الصف (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة أمان: السماح للمستخدمين بالوصول إلى مدفوعاتهم فقط
CREATE POLICY "Allow users to access their own payments"
ON public.payments
FOR ALL
USING (auth.uid() = user_id);

-- إضافة فهرس (index) على `debt_id` لتحسين أداء الاستعلامات
CREATE INDEX idx_payments_debt_id ON public.payments(debt_id);

-- إضافة فهرس على `user_id`
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
