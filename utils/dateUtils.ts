// دوال التاريخ والعملة

/**
 * تحويل التاريخ إلى نص قابل للقراءة (DD/MM/YYYY)
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * تحويل التاريخ إلى نص قصير (DD/MM)
 */
export const formatDateShort = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * تحويل المبلغ إلى عملة مقروءة (دينار جزائري)
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-DZ')} دج`;
};

/**
 * تحويل المبلغ إلى عملة مبسطة (دينار جزائري)
 */
export const formatCurrencySimple = (amount: number): string => {
  return `${amount} دج`;
};

/**
 * فحص إذا كان التاريخ متأخر (أكثر من 30 يوم)
 */
export const isOverdue = (timestamp: number): boolean => {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  return timestamp < thirtyDaysAgo;
};

/**
 * حساب عدد الأيام المتأخرة
 */
export const getDaysOverdue = (timestamp: number): number => {
  const now = Date.now();
  const diffTime = now - timestamp;
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
};

/**
 * حساب عدد الأيام حتى التذكير
 */
export const getDaysUntilReminder = (debtDate: number, reminderDays: number): number => {
  const now = Date.now();
  const reminderDate = debtDate + (reminderDays * 24 * 60 * 60 * 1000);
  const diffTime = reminderDate - now;
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  return diffDays;
};

/**
 * فحص إذا كان الدين يحتاج تذكير
 */
export const needsReminder = (
  debtDate: number, 
  reminderDays: number, 
  lastReminderSent?: number
): boolean => {
  const now = Date.now();
  const reminderDate = debtDate + (reminderDays * 24 * 60 * 60 * 1000);
  
  // إذا لم يحن وقت التذكير بعد
  if (now < reminderDate) {
    return false;
  }
  
  // إذا لم يتم إرسال تذكير من قبل
  if (!lastReminderSent) {
    return true;
  }
  
  // إذا مر أكثر من 7 أيام على آخر تذكير
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  return lastReminderSent < sevenDaysAgo;
};

/**
 * إنشاء معرف فريد بناءً على التاريخ
 */
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

/**
 * حساب الإحصائيات الأساسية
 */
export const calculateStats = (debts: any[]) => {
  const unpaidDebts = debts.filter(debt => !debt.isPaid);
  const totalUnpaid = unpaidDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const overdueDebts = unpaidDebts.filter(debt => isOverdue(debt.date));
  
  return {
    totalUnpaid,
    unpaidCount: unpaidDebts.length,
    overdueCount: overdueDebts.length,
    recentDebts: unpaidDebts.slice(0, 5)
  };
}; 