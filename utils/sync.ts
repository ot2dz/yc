// utils/sync.ts
import { supabase } from './supabase';
import { useAppStore } from '../store/appStore';
import { Customer, Debt } from '../types';

// إضافة عميل جديد
export async function addCustomerToSupabase(customer: Omit<Customer, 'id'>) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select();

  if (error) throw error;
  return data?.[0];
}

// إضافة دين جديد
export async function addDebtToSupabase(debt: Omit<Debt, 'id'>) {
  const { data, error } = await supabase
    .from('debts')
    .insert([debt])
    .select();

  if (error) throw error;
  return data?.[0];
}

// جلب كل العملاء
export async function fetchCustomersFromSupabase() {
  const { data, error } = await supabase
    .from('customers')
    .select('*');
  if (error) throw error;
  return data;
}

// جلب كل الديون
export async function fetchDebtsFromSupabase() {
  const { data, error } = await supabase
    .from('debts')
    .select('*');
  if (error) throw error;
  return data;
}

// ✨ النسخة المحسّنة من دالة المزامنة
export async function syncAllToSupabase(): Promise<boolean> {
  const { customers, debts, payments, updateCustomer, updateDebt } = useAppStore.getState();
  let allSuccess = true;

  // Helper function to update payment sync status
  const updatePaymentStatus = (id: string, status: 'synced' | 'error') => {
    // This function needs to be implemented in appStore if we want to track payment sync status individually
  };

  // 1. التعامل مع الحذف (العملاء والديون)
  const customersToDelete = customers.filter(c => c.sync_status === 'pending' && c.deleted_at);
  if (customersToDelete.length > 0) {
    const { error } = await supabase.from('customers').delete().in('id', customersToDelete.map(c => c.id));
    if (error) allSuccess = false;
    customersToDelete.forEach(c => updateCustomer(c.id, { sync_status: error ? 'error' : 'synced' }, { sync: false }));
  }
  
  const debtsToDelete = debts.filter(d => d.sync_status === 'pending' && d.deleted_at);
  if (debtsToDelete.length > 0) {
    const { error } = await supabase.from('debts').delete().in('id', debtsToDelete.map(d => d.id));
    if (error) allSuccess = false;
    debtsToDelete.forEach(d => updateDebt(d.id, { sync_status: error ? 'error' : 'synced' }, { sync: false }));
  }

  // 2. التعامل مع الإنشاء والتحديث
  // Customers
  const customersToUpsert = customers.filter(c => c.sync_status === 'pending' && !c.deleted_at);
  for (const customer of customersToUpsert) {
    const { sync_status, deleted_at, ...rawCustomer } = customer;
    const { error } = await supabase.from('customers').upsert({
      ...rawCustomer,
      created_at: new Date(rawCustomer.created_at).toISOString(),
    });
    if (error) allSuccess = false;
    updateCustomer(customer.id, { sync_status: error ? 'error' : 'synced' }, { sync: false });
  }

  // Debts
  const debtsToUpsert = debts.filter(d => d.sync_status === 'pending' && !d.deleted_at);
  for (const debt of debtsToUpsert) {
    const { sync_status, deleted_at, ...rawDebt } = debt;
    const { error } = await supabase.from('debts').upsert({
      ...rawDebt,
      date: new Date(rawDebt.date).toISOString(),
      paid_at: rawDebt.paid_at ? new Date(rawDebt.paid_at).toISOString() : undefined,
    });
    if (error) allSuccess = false;
    updateDebt(debt.id, { sync_status: error ? 'error' : 'synced' }, { sync: false });
  }
  
  // Payments
  const paymentsToUpsert = payments.filter(p => p.sync_status === 'pending');
  if (paymentsToUpsert.length > 0) {
    const cleanPayments = paymentsToUpsert.map(p => {
      const { sync_status, date, ...rawPayment } = p;
      return {
        ...rawPayment,
        created_at: new Date(date).toISOString(),
      };
    });
    const { error } = await supabase.from('payments').insert(cleanPayments);
    if (error) {
      console.error("Payment sync error:", error);
      allSuccess = false;
    }
    // Ideally, update payment status here, but for now we assume it's ok
    // or handle it in a more robust queue system.
  }

  return allSuccess;
}