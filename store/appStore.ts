import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer, Debt, ReminderSettings, AppState, Payment, CreateDebtForm, MonthlyReport, CustomerStats, PaymentTrend, DebtsByStatus, CreatePaymentForm } from '../types';
import { generateId } from '../utils/dateUtils';

interface AppStore extends AppState {
  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'sync_status'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Omit<Customer, 'id'>>, options?: { sync?: boolean }) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  
  // Debt Actions
  addDebt: (debt: Omit<Debt, 'id' | 'sync_status' | 'amount_paid' | 'is_paid' | 'paid_at' | 'last_reminder_sent'>) => void;
  updateDebt: (id: string, debt: Partial<Omit<Debt, 'id'>>, options?: { sync?: boolean }) => void;
  deleteDebt: (id: string) => void;
  getDebt: (id: string) => Debt | undefined;
  getCustomerDebts: (customer_id: string) => Debt[];
  
  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id' | 'sync_status'>) => void;
  markDebtAsPaid: (id: string) => void;
  getRemainingAmount: (debt: Debt) => number;
  
  // Settings Actions
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  updateLastReminderSent: (debtId: string, timestamp: number) => void;
  
  // Helper and Aggregate Actions
  getPaymentsForDebt: (debtId: string) => Payment[];
  getTotalUnpaidAmount: () => number;
  getUnpaidDebts: () => Debt[];
  getOverdueDebts: () => Debt[];
  getRecentDebts: (limit?: number) => Debt[];
  
  // Reports and Stats Actions
  getMonthlyCollectedReport: (year: number, month: number) => MonthlyReport;
  getTopCustomers: (limit?: number) => CustomerStats[];
  getPaymentTrends: (months?: number) => PaymentTrend[];
  getDebtsByStatus: () => DebtsByStatus;
}


export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial State
      customers: [],
      debts: [],
      payments: [],
      reminderSettings: {
        enabled: true,
        shopName: 'متجر يوسف للأقمشة',
        reminderMessage: 'مرحباً {name}، هذه رسالة تذكيرية من {shopName} لدفع الدين المتبقي: {amount}. شكراً لك على تعاملك الكريم معنا.',
        autoOpenSms: true,
        overdueNotificationsEnabled: true,
        overduePeriodDays: 30,
      },
      
      // Customer Actions
      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          id: generateId(),
          created_at: Date.now(),
          ...customerData,
          sync_status: 'pending',
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        return newCustomer;
      },
      
      updateCustomer: (id, customerData, options = { sync: true }) => {
        set((state) => ({
          customers: state.customers.map(customer =>
            customer.id === id ? { ...customer, ...customerData, sync_status: options.sync ? 'pending' : customer.sync_status } : customer
          )
        }));
      },
      
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, deleted_at: Date.now(), sync_status: 'pending' } : c),
          debts: state.debts.map(d => d.customer_id === id ? { ...d, deleted_at: Date.now(), sync_status: 'pending' } : d),
        }));
      },
      
      getCustomer: (id) => get().customers.find(customer => customer.id === id && !customer.deleted_at),
      
      // Debt Actions
      addDebt: (debtData) => {
        const newDebt: Debt = {
          id: generateId(),
          amount_paid: 0,
          is_paid: false,
          ...debtData,
          sync_status: 'pending',
        };
        set((state) => ({ debts: [...state.debts, newDebt] }));
      },
      
      updateDebt: (id, debtData, options = { sync: true }) => {
        set((state) => ({
          debts: state.debts.map(debt =>
            debt.id === id ? { ...debt, ...debtData, sync_status: options.sync ? 'pending' : debt.sync_status } : debt
          )
        }));
      },
      
      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.map(debt => debt.id === id ? { ...debt, deleted_at: Date.now(), sync_status: 'pending' } : debt)
        }));
      },
      
      getDebt: (id) => get().debts.find(debt => debt.id === id && !debt.deleted_at),

      getCustomerDebts: (customerId) => get().debts.filter(debt => debt.customer_id === customerId && !debt.deleted_at),

      // Payment Actions
      addPayment: (paymentData) => {
        const newPayment: Payment = {
          id: generateId(),
          ...paymentData,
          sync_status: 'pending',
        };

        set((state) => {
          const newPayments = [...state.payments, newPayment];
          
          const debtToUpdate = state.debts.find(d => d.id === newPayment.debt_id);
          if (!debtToUpdate) {
            return { payments: newPayments };
          }

          const paymentsForThisDebt = newPayments.filter(p => p.debt_id === newPayment.debt_id);
          const totalPaidForThisDebt = paymentsForThisDebt.reduce((sum, p) => sum + p.amount, 0);
          const isNowFullyPaid = totalPaidForThisDebt >= debtToUpdate.amount;

          const updatedDebts = state.debts.map(d => {
            if (d.id === newPayment.debt_id) {
              return {
                ...d,
                amount_paid: totalPaidForThisDebt,
                is_paid: isNowFullyPaid,
                paid_at: isNowFullyPaid ? Date.now() : undefined,
                sync_status: 'pending' as const,
              };
            }
            return d;
          });

          return {
            payments: newPayments,
            debts: updatedDebts,
          };
        });
      },
      
      markDebtAsPaid: (debtId) => {
        const debt = get().getDebt(debtId);
        if (!debt) return;
        
        const remainingAmount = get().getRemainingAmount(debt);

        if (remainingAmount > 0) {
          get().addPayment({
            debt_id: debtId,
            amount: remainingAmount,
            date: Date.now(),
            notes: 'تسديد الدين بالكامل'
          });
        } else if (!debt.is_paid) {
           get().updateDebt(debtId, { is_paid: true, paid_at: Date.now() });
        }
      },
      
      getRemainingAmount: (debt) => {
        const payments = get().getPaymentsForDebt(debt.id);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        return Math.max(0, debt.amount - totalPaid);
      },

      // Settings Actions
      updateReminderSettings: (settings) => {
        set((state) => ({ reminderSettings: { ...state.reminderSettings, ...settings } }));
      },
      
      updateLastReminderSent: (debtId, timestamp) => {
        get().updateDebt(debtId, { last_reminder_sent: timestamp });
      },
      
      // Helper and Aggregate Actions
      getPaymentsForDebt: (debtId) => get().payments.filter(p => p.debt_id === debtId),

      getTotalUnpaidAmount: () => {
        const unpaidDebts = get().getUnpaidDebts();
        return unpaidDebts.reduce((total, debt) => total + get().getRemainingAmount(debt), 0);
      },
      
      getUnpaidDebts: () => get().debts.filter(debt => !debt.is_paid && !debt.deleted_at),
      
      getOverdueDebts: () => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return get().getUnpaidDebts().filter(debt => debt.date < thirtyDaysAgo);
      },

      getRecentDebts: (limit = 5) => {
        return get()
          .getUnpaidDebts()
          .sort((a, b) => b.date - a.date)
          .slice(0, limit);
      },
      
      // Reports and Stats Actions
      getMonthlyCollectedReport: (year, month) => {
        const startOfMonth = new Date(year, month - 1, 1).getTime();
        const endOfMonth = new Date(year, month, 0, 23, 59, 59).getTime();
        
        const monthlyPayments = get().payments.filter(p => p.date >= startOfMonth && p.date <= endOfMonth);
        
        return monthlyPayments.reduce((acc, payment) => {
          acc.totalCollected += payment.amount;
          acc.paymentsCount++;
          return acc;
        }, { totalCollected: 0, paymentsCount: 0 });
      },

      getTopCustomers: (limit = 10) => {
        const { customers } = get();
        
        const customerStats = customers
          .filter(c => !c.deleted_at)
          .map(customer => {
            const customerDebts = get().getCustomerDebts(customer.id);
            const totalAmount = customerDebts.reduce((sum, debt) => sum + debt.amount, 0);
            const totalPaid = customerDebts.reduce((sum, debt) => sum + debt.amount_paid, 0);
            const overdueDebts = customerDebts.filter(d => get().getOverdueDebts().some(od => od.id === d.id)).length;

            return {
              customer,
              totalAmount,
              totalPaid,
              debtCount: customerDebts.length,
              overdueDebts,
              avgDebtAmount: customerDebts.length > 0 ? totalAmount / customerDebts.length : 0,
            };
        });
        
        return customerStats
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, limit);
      },

      getPaymentTrends: (months = 6) => {
        const trends: PaymentTrend[] = [];
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          
          const monthData = get().getMonthlyCollectedReport(year, month);
          
          trends.push({
            year,
            month,
            monthName: new Intl.DateTimeFormat('ar-DZ', { month: 'long' }).format(date),
            totalCollected: monthData.totalCollected,
            paymentsCount: monthData.paymentsCount,
          });
        }
        return trends;
      },

      getDebtsByStatus: () => {
         return get().debts.reduce<DebtsByStatus>((acc, debt) => {
           if(debt.deleted_at) return acc;
           
           const remaining = get().getRemainingAmount(debt);

           if (debt.is_paid) {
             acc.paid.count++;
             acc.paid.amount += debt.amount;
           } else if (get().getOverdueDebts().some(d => d.id === debt.id)) {
             acc.overdue.count++;
             acc.overdue.amount += remaining;
           } else {
             acc.current.count++;
             acc.current.amount += remaining;
           }
           return acc;
         }, { paid: { count: 0, amount: 0 }, overdue: { count: 0, amount: 0 }, current: { count: 0, amount: 0 } });
      },
    }),
    {
      name: 'app-storage-simplified', // Renaming storage to ensure a fresh start
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        customers: state.customers,
        debts: state.debts,
        payments: state.payments,
        reminderSettings: state.reminderSettings
      }),
      version: 1, 
    }
  )
);
