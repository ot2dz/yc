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
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  Receipt
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { useAppStore } from '../../store/appStore';
import { formatDate, formatCurrency, getDaysOverdue, isOverdue, formatDateShort } from '../../utils/dateUtils';
import { Customer, Debt, Payment } from '../../types';
import PaymentModal from '../../components/PaymentModal';

export default function DebtDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { debts, deleteDebt, addPayment, getRemainingAmount, getCustomer, getPaymentsForDebt } = useAppStore();
  
  const [debt, setDebt] = useState<Debt | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    // البحث عن الدين
    const foundDebt = debts.find(d => d.id === id);
    setDebt(foundDebt || null);
    
    // البحث عن العميل
    if (foundDebt) {
      const foundCustomer = getCustomer(foundDebt.customer_id);
      setCustomer(foundCustomer || null);
    }
  }, [id, debts]);

  // إذا لم يجد الدين
  if (!debt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل الدين</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>الدين غير موجود</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const remainingAmount = getRemainingAmount(debt);
  const isOverdueDebt = !debt.is_paid && isOverdue(debt.date);
  const payments = getPaymentsForDebt(debt.id);
  const hasPayments = payments.length > 0;

  // تسديد دين
  const handleAddPayment = (amount: number, notes?: string) => {
    addPayment({
      debt_id: debt.id,
      amount: amount,
      date: Date.now(),
      notes: notes,
    });
    Alert.alert('تم التسديد', `تم تسديد ${formatCurrency(amount)} بنجاح`);
  };

  // حذف دين
  const handleDeleteDebt = () => {
    Alert.alert(
      'حذف الدين',
      'هل تريد حذف هذا الدين نهائياً؟ سيتم حذف جميع المدفوعات المرتبطة به.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            deleteDebt(debt.id);
            Alert.alert('تم الحذف', 'تم حذف الدين بنجاح', [
              {
                text: 'موافق',
                onPress: () => router.back()
              }
            ]);
          }
        }
      ]
    );
  };

  // عرض كل دفعة
  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentAmount}>
          <Receipt size={16} color={Colors.success} />
          <Text style={styles.paymentAmountText}>
            {formatCurrency(typeof item.amount === 'number' ? item.amount : 0)}
          </Text>
        </View>
        <Text style={styles.paymentDate}>
          {formatDate(typeof item.date === 'number' ? item.date : Date.now())}
        </Text>
      </View>
      {item.notes && (
        <Text style={styles.paymentNotes}>{item.notes}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* العنوان */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الدين</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            // سيتم إضافة شاشة تعديل الدين لاحقاً
            Alert.alert('قريباً', 'ميزة تعديل الدين ستتوفر قريباً');
          }}
        >
          <Edit size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* معلومات العميل */}
        {customer && (
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <User size={24} color={Colors.primary} />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={styles.customerPhone}>
                  <Phone size={14} color={Colors.textSecondary} />
                  <Text style={styles.phoneText}>{customer.phone}</Text>
                </View>
              </View>
              <Link href={`/customer/${customer.id}`} asChild>
                <TouchableOpacity style={styles.viewCustomerButton}>
                  <Text style={styles.viewCustomerButtonText}>عرض العميل</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        )}

        {/* تفاصيل الدين */}
        <View style={styles.debtCard}>
          <View style={styles.debtHeader}>
            <View style={styles.debtStatus}>
              {debt.is_paid ? (
                <CheckCircle size={24} color={Colors.success} />
              ) : isOverdueDebt ? (
                <AlertTriangle size={24} color={Colors.error} />
              ) : (
                <Clock size={24} color={Colors.warning} />
              )}
              <Text style={[
                styles.debtStatusText,
                debt.is_paid && styles.paidStatusText,
                isOverdueDebt && styles.overdueStatusText
              ]}>
                {debt.is_paid ? 'مسدد بالكامل' : isOverdueDebt ? `متأخر ${getDaysOverdue(debt.date)} يوم` : 'غير مسدد'}
              </Text>
            </View>
          </View>

          {/* المبالغ */}
          <View style={styles.amountsSection}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>المبلغ الأصلي:</Text>
              <Text style={styles.amountValue}>{formatCurrency(debt.amount)}</Text>
            </View>
            
            {hasPayments && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>المبلغ المسدد:</Text>
                <Text style={[styles.amountValue, styles.paidAmountValue]}>
                  {formatCurrency(typeof debt.amount_paid === 'number' ? debt.amount_paid : 0)}
                </Text>
              </View>
            )}
            
            {!debt.is_paid && (
              <View style={[styles.amountRow, styles.remainingRow]}>
                <Text style={styles.amountLabel}>المبلغ المتبقي:</Text>
                <Text style={[styles.amountValue, styles.remainingAmountValue]}>
                  {formatCurrency(remainingAmount)}
                </Text>
              </View>
            )}
          </View>

          {/* معلومات إضافية */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>تاريخ الدين:</Text>
              <Text style={styles.infoValue}>{formatDate(debt.date)}</Text>
            </View>
            
            {debt.paid_at && (
              <View style={styles.infoRow}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.infoLabel}>تاريخ التسديد:</Text>
                <Text style={styles.infoValue}>{formatDate(debt.paid_at)}</Text>
              </View>
            )}
            
            {debt.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>ملاحظات:</Text>
                <Text style={styles.notesText}>{debt.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* المدفوعات */}
        {hasPayments && (
          <View style={styles.paymentsSection}>
            <Text style={styles.sectionTitle}>تاريخ المدفوعات ({payments.length})</Text>
            <FlatList
              data={payments.sort((a, b) => (b.date || 0) - (a.date || 0))}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

      </ScrollView>

      {/* أزرار الإجراءات */}
      <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 16 }]}>
        {!debt.is_paid && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => setPaymentModalVisible(true)}
          >
            <CreditCard size={20} color={Colors.textWhite} />
            <Text style={styles.payButtonText}>تسديد</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteDebt}
        >
          <Trash2 size={20} color={Colors.error} />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة التسديد */}
      <PaymentModal
        debt={debt}
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onPayment={handleAddPayment}
        remainingAmount={remainingAmount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  customerCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
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
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
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
  viewCustomerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewCustomerButtonText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  debtCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debtHeader: {
    marginBottom: 16,
  },
  debtStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 8,
  },
  paidStatusText: {
    color: Colors.success,
  },
  overdueStatusText: {
    color: Colors.error,
  },
  amountsSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  remainingRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'left',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
    minWidth: 100,
  },
  paidAmountValue: {
    color: Colors.success,
  },
  remainingAmountValue: {
    color: Colors.error,
    fontSize: 18,
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  paymentsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentAmountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.success,
    marginLeft: 6,
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  paymentNotes: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  payButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  goBackButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
}); 