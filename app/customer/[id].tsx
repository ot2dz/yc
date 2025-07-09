import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router, Link } from 'expo-router';
import { 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  Edit, 
  Trash2,
  Plus,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Clock
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { useAppStore } from '../../store/appStore';
import { formatDate, formatCurrency, getDaysOverdue, isOverdue, formatDateShort } from '../../utils/dateUtils';
import { Customer, Debt, ReminderData } from '../../types';
import PaymentModal from '../../components/PaymentModal';
import ReminderModal from '../../components/ReminderModal';

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { customers, debts, updateDebt, deleteDebt, deleteCustomer, addPayment, getRemainingAmount, reminderSettings } = useAppStore();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerDebts, setCustomerDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderData, setReminderData] = useState<ReminderData | null>(null);

  useEffect(() => {
    // البحث عن العميل
    const foundCustomer = customers.find(c => c.id === id);
    setCustomer(foundCustomer || null);
    
    // البحث عن ديون العميل
    const foundDebts = debts.filter(d => d.customer_id === id);
    setCustomerDebts(foundDebts);
  }, [id, customers, debts]);

  // حساب الإحصائيات
  const totalRemainingDebt = customerDebts.reduce((sum, debt) => sum + getRemainingAmount(debt), 0);
  const totalPaidAmount = customerDebts.reduce((sum, debt) => sum + (typeof debt.amount_paid === 'number' ? debt.amount_paid : 0), 0);
  const paidDebts = customerDebts.filter(debt => debt.is_paid);
  const unpaidDebts = customerDebts.filter(debt => !debt.is_paid);
  const overdueDebts = unpaidDebts.filter(debt => isOverdue(debt.date));

  // فتح نافذة التسديد
  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentModalVisible(true);
  };

  // تسديد دين
  const handleAddPayment = (amount: number, notes?: string) => {
    if (selectedDebt) {
      addPayment(selectedDebt.id, amount, notes);
      Alert.alert('تم التسديد', `تم تسديد ${formatCurrency(amount)} بنجاح`);
    }
  };

  // حذف دين
  const handleDeleteDebt = (debtId: string) => {
    Alert.alert(
      'حذف الدين',
      'هل تريد حذف هذا الدين نهائياً؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteDebt(debtId)
        }
      ]
    );
  };

  // حذف العميل
  const handleDeleteCustomer = () => {
    if (unpaidDebts.length > 0) {
      Alert.alert('تنبيه', 'لا يمكن حذف العميل لوجود ديون غير مسددة');
      return;
    }

    Alert.alert(
      'حذف العميل',
      'هل تريد حذف هذا العميل نهائياً؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            deleteCustomer(id as string);
            router.back();
          }
        }
      ]
    );
  };

  // إرسال تذكير
  const handleSendReminder = () => {
    if (!customer) {
      Alert.alert('خطأ', 'معلومات العميل غير متوفرة');
      return;
    }

    if (unpaidDebts.length === 0) {
      Alert.alert('تنبيه', 'لا توجد ديون مستحقة لإرسال تذكير');
      return;
    }

    const reminderInfo: ReminderData = {
      customerName: customer.name,
      customerPhone: customer.phone,
      totalDebt: totalRemainingDebt,
      shopName: reminderSettings.shopName,
      message: reminderSettings.reminderMessage
        .replace('{name}', customer.name)
        .replace('{shopName}', reminderSettings.shopName)
        .replace('{amount}', formatCurrency(totalRemainingDebt))
    };

    setReminderData(reminderInfo);
    setReminderModalVisible(true);
  };

  // عرض كل دين
  const renderDebtItem = ({ item }: { item: Debt }) => {
    const remainingAmount = getRemainingAmount(item);
    const hasPayments = Array.isArray(item.payments) && item.payments.length > 0;
    
    return (
      <View style={styles.debtCard}>
        <View style={styles.debtHeader}>
          <View style={styles.debtAmount}>
            <View style={styles.amountInfo}>
              <Text style={[styles.amountText, item.is_paid && styles.paidAmountText]}>
                {formatCurrency(item.amount)}
              </Text>
              {hasPayments && (
                <Text style={styles.paidText}>
                  مسدد: {formatCurrency(typeof item.amount_paid === 'number' ? item.amount_paid : 0)}
                </Text>
              )}
              {!item.is_paid && remainingAmount < item.amount && (
                <Text style={styles.remainingText}>
                  متبقي: {formatCurrency(remainingAmount)}
                </Text>
              )}
            </View>
            {item.is_paid ? (
              <CheckCircle size={16} color={Colors.success} />
            ) : isOverdue(item.date) ? (
              <AlertTriangle size={16} color={Colors.error} />
            ) : (
              <DollarSign size={16} color={Colors.warning} />
            )}
          </View>
          <Text style={styles.debtDate}>{formatDate(item.date)}</Text>
        </View>

        {item.notes && (
          <Text style={styles.debtNotes}>{item.notes}</Text>
        )}

        {!item.is_paid && isOverdue(item.date) && (
          <Text style={styles.overdueText}>
            متأخر {getDaysOverdue(item.date)} يوم
          </Text>
        )}

        {/* عرض المدفوعات */}
        {hasPayments && (
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentsTitle}>المدفوعات:</Text>
            {(item.payments || []).slice(0, 3).map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <Text style={styles.paymentAmount}>
                  {formatCurrency(typeof payment.amount === 'number' ? payment.amount : 0)}
                </Text>
                <Text style={styles.paymentDate}>
                  {formatDateShort(typeof payment.date === 'number' ? payment.date : Date.now())}
                </Text>
              </View>
            ))}
            {(item.payments || []).length > 3 && (
              <Text style={styles.morePayments}>
                +{(item.payments || []).length - 3} مدفوعات أخرى
              </Text>
            )}
          </View>
        )}

        <View style={styles.debtActions}>
          {!item.is_paid && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePayDebt(item)}
            >
              <CreditCard size={16} color={Colors.success} />
              <Text style={styles.payButtonText}>تسديد</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDebt(item.id)}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>العميل غير موجود</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* معلومات العميل */}
        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <User size={32} color={Colors.primary} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <View style={styles.customerPhone}>
                <Phone size={16} color={Colors.textSecondary} />
                <Text style={styles.phoneText}>{customer.phone}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push(`/customer/edit/${customer.id}`)}
            >
              <Edit size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.customerDate}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.dateText}>
              عميل منذ {formatDate(customer.created_at)}
            </Text>
          </View>
        </View>

        {/* إحصائيات الديون */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.totalCard]}>
            <Text style={styles.statNumber}>{formatCurrency(totalRemainingDebt)}</Text>
            <Text style={styles.statLabel}>متبقي</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.successNumber]}>{formatCurrency(totalPaidAmount)}</Text>
            <Text style={styles.statLabel}>مسدد</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.errorNumber]}>{overdueDebts.length}</Text>
            <Text style={styles.statLabel}>متأخرة</Text>
          </View>
        </View>

        {/* إجراءات سريعة */}
        <View style={styles.quickActions}>
          <Link href={`/debt/add?customerId=${customer.id}`} asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.actionButtonText}>إضافة دين</Text>
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSendReminder}
          >
            <MessageCircle size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>إرسال تذكير</Text>
          </TouchableOpacity>
        </View>

        {/* قائمة الديون */}
        <View style={styles.debtsSection}>
          <Text style={styles.sectionTitle}>الديون ({customerDebts.length})</Text>
          
          {customerDebts.length > 0 ? (
            <FlatList
              data={customerDebts.sort((a, b) => b.date - a.date)}
              renderItem={renderDebtItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>لا توجد ديون</Text>
              <Text style={styles.emptyStateSubtext}>ابدأ بإضافة دين جديد</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* أزرار الإجراءات */}
      <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.deleteCustomerButton}
          onPress={handleDeleteCustomer}
        >
          <Trash2 size={20} color={Colors.error} />
          <Text style={styles.deleteCustomerButtonText}>حذف العميل</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة التسديد */}
      <PaymentModal
        debt={selectedDebt}
        visible={paymentModalVisible}
        onClose={() => {
          setPaymentModalVisible(false);
          setSelectedDebt(null);
        }}
        onPayment={handleAddPayment}
        remainingAmount={selectedDebt ? getRemainingAmount(selectedDebt) : 0}
      />

      {/* نافذة التذكير */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => {
          setReminderModalVisible(false);
          setReminderData(null);
        }}
        reminderData={reminderData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
  },
  customerCard: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  editButton: {
    padding: 8,
  },
  customerDate: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  totalCard: {
    backgroundColor: Colors.primary,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  successNumber: {
    color: Colors.success,
  },
  errorNumber: {
    color: Colors.error,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  debtsSection: {
    marginHorizontal: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  debtCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debtAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
    marginRight: 8,
  },
  paidAmountText: {
    color: Colors.success,
    textDecorationLine: 'line-through',
  },
  paidText: {
    fontSize: 12,
    color: Colors.success,
    marginRight: 8,
  },
  remainingText: {
    fontSize: 12,
    color: Colors.warning,
    marginRight: 8,
  },
  debtDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  debtNotes: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  overdueText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  debtActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payButtonText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
  paymentsSection: {
    marginBottom: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
  },
  paymentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentAmount: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  morePayments: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteCustomerButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCustomerButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 