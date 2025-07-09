// نماذج البيانات الأساسية للتطبيق

export interface Customer {
  id: string;           // معرف فريد للعميل
  name: string;         // اسم العميل
  phone: string;        // رقم الهاتف
  created_at: number;    // تاريخ الإنشاء
  sync_status?: 'pending' | 'synced' | 'error'; // حالة المزامنة
  deleted_at?: number; // تاريخ الحذف الناعم
}

export interface Payment {
  id: string;               // معرف الدفعة
  debt_id: string;          // معرف الدين المرتبط
  amount: number;           // مبلغ الدفعة
  date: number;             // تاريخ الدفعة
  notes?: string;           // ملاحظات الدفعة
  sync_status?: 'pending' | 'synced' | 'error'; // حالة المزامنة
}

export interface Debt {
  id: string;                    // معرف فريد للدين
  customer_id: string;            // معرف العميل المرتبط بالدين
  amount: number;                // مبلغ الدين الأصلي
  amount_paid: number;            // المبلغ المسدد
  date: number;                  // تاريخ الدين
  notes: string;                 // ملاحظات إضافية
  is_paid: boolean;               // حالة الدفع (مسدد بالكامل)
  paid_at?: number;               // تاريخ التسديد الكامل
  reminder_date?: number;         // تاريخ التذكير
  last_reminder_sent?: number;     // آخر تذكير تم إرساله
  sync_status?: 'pending' | 'synced' | 'error'; // حالة المزامنة
  deleted_at?: number; // تاريخ الحذف الناعم
}

export interface ReminderSettings {
  enabled: boolean;              // تفعيل التذكيرات (للرسائل القصيرة)
  shopName: string;              // اسم المتجر
  reminderMessage: string;       // قالب رسالة التذكير
  autoOpenSms: boolean;          // فتح تطبيق الرسائل تلقائياً

  // إعدادات إشعارات الديون المتأخرة
  overdueNotificationsEnabled: boolean; // تفعيل إشعارات الديون المتأخرة
  overduePeriodDays: number;            // فترة اعتبار الدين متأخراً (بالأيام)
}

export interface AppState {
  customers: Customer[];
  debts: Debt[];
  payments: Payment[];
  reminderSettings: ReminderSettings;
}

// أنواع إضافية للواجهة
export interface CustomerWithDebt extends Customer {
  totalDebt: number;
  unpaidDebts: number;
}

export interface DebtWithCustomer extends Debt {
  customerName: string;
  customerPhone: string;
}

// نماذج للتسديد
export interface PaymentForm {
  amount: string;
  notes?: string;
}

// نماذج التذكير
export interface ReminderData {
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  shopName: string;
  message: string;
}

// أنواع للنماذج (Forms)
export type CreateCustomerForm = Omit<Customer, 'id' | 'created_at'>;
export type CreateDebtForm = Omit<Debt, 'id' | 'last_reminder_sent' | 'amount_paid' | 'is_paid' | 'paid_at'>;
export type CreatePaymentForm = Omit<Payment, 'id' | 'sync_status'>;
export type UpdateCustomerForm = Partial<CreateCustomerForm>;
export type UpdateDebtForm = Partial<CreateDebtForm>;

// أنواع التقارير والإحصائيات
export interface MonthlyReport {
  totalCollected: number;
  paymentsCount: number;
}

export interface CustomerStats {
  customer: Customer;
  totalAmount: number;
  totalPaid: number;
  debtCount: number;
  overdueDebts: number;
  avgDebtAmount: number;
}

export interface PaymentTrend {
  year: number;
  month: number;
  monthName: string;
  totalCollected: number;
  paymentsCount: number;
}

export interface DebtsByStatus {
  paid: { count: number; amount: number };
  overdue: { count: number; amount: number };
  current: { count: number; amount: number };
} 