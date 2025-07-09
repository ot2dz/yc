import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DollarSign, CheckCircle, X, Calculator } from 'lucide-react-native';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import { Debt } from '../types';

interface PaymentModalProps {
  debt: Debt | null;
  visible: boolean;
  onClose: () => void;
  onPayment: (amount: number, notes?: string) => void;
  remainingAmount: number;
}

// دالة آمنة لاستخراج القيم الرقمية
const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  return 0;
};

export default function PaymentModal({
  debt,
  visible,
  onClose,
  onPayment,
  remainingAmount,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});

  // إعادة تعيين النموذج عند فتح النافذة
  useEffect(() => {
    if (visible && debt) {
      setAmount('');
      setNotes('');
      setErrors({});
    }
  }, [visible, debt]);

  // مسح الأخطاء عند تغيير المبلغ
  useEffect(() => {
    if (errors.amount && amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  }, [amount]);

  const validateAmount = (): boolean => {
    const newErrors: { amount?: string } = {};
    const numAmount = parseFloat(amount);

    if (!amount.trim()) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون رقماً موجباً';
    } else if (numAmount > remainingAmount) {
      newErrors.amount = `المبلغ لا يمكن أن يتجاوز ${formatCurrency(remainingAmount)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = () => {
    if (!validateAmount()) return;

    const paymentAmount = parseFloat(amount);
    const isFullPayment = paymentAmount >= remainingAmount;

    Alert.alert(
      'تأكيد التسديد',
      `هل تريد تسديد ${formatCurrency(paymentAmount)}؟${
        isFullPayment ? '\nسيتم تسديد الدين بالكامل.' : `\nسيتبقى ${formatCurrency(remainingAmount - paymentAmount)}.`
      }`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسديد',
          onPress: () => {
            onPayment(paymentAmount, notes.trim() || undefined);
            onClose();
          },
        },
      ]
    );
  };

  const handleFullPayment = () => {
    setAmount(remainingAmount.toString());
    setNotes('تسديد كامل');
  };

  if (!debt) return null;

  // استخراج القيم الآمنة
  const safeAmount = safeNumber(debt.amount);
  const safeAmountPaid = safeNumber(debt.amount_paid);
  const safeRemainingAmount = safeNumber(remainingAmount);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modal}>
            {/* العنوان */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <DollarSign size={32} color={Colors.primary} />
              </View>
              <Text style={styles.title}>تسديد دين</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* معلومات الدين */}
            <View style={styles.debtInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>المبلغ الأصلي:</Text>
                <Text style={styles.infoValue}>{formatCurrency(safeAmount)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>المبلغ المسدد:</Text>
                <Text style={[styles.infoValue, styles.paidAmount]}>
                  {formatCurrency(safeAmountPaid)}
                </Text>
              </View>
              <View style={[styles.infoRow, styles.remainingRow]}>
                <Text style={styles.infoLabel}>المبلغ المتبقي:</Text>
                <Text style={[styles.infoValue, styles.remainingAmount]}>
                  {formatCurrency(safeRemainingAmount)}
                </Text>
              </View>
            </View>

            {/* النموذج */}
            <View style={styles.form}>
              <View style={styles.amountContainer}>
                <Text style={styles.label}>مبلغ التسديد</Text>
                <View style={[styles.inputContainer, errors.amount && styles.inputError]}>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <Text style={styles.currency}>دج</Text>
                </View>
                {errors.amount && (
                  <Text style={styles.errorText}>{errors.amount}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.fullPaymentButton}
                onPress={handleFullPayment}
              >
                <Calculator size={16} color={Colors.primary} />
                <Text style={styles.fullPaymentText}>
                  تسديد كامل ({formatCurrency(safeRemainingAmount)})
                </Text>
              </TouchableOpacity>

              <View style={styles.notesContainer}>
                <Text style={styles.label}>ملاحظات (اختياري)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="أدخل ملاحظات..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* الأزرار */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.payButton, !amount && styles.disabledButton]}
                onPress={handlePayment}
                disabled={!amount}
              >
                <CheckCircle size={20} color={Colors.textWhite} />
                <Text style={styles.payButtonText}>تسديد</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  debtInfo: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  remainingRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paidAmount: {
    color: Colors.success,
  },
  remainingAmount: {
    color: Colors.error,
    fontSize: 16,
  },
  form: {
    marginBottom: 20,
  },
  amountContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: Colors.error,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
  },
  currency: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  fullPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  fullPaymentText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    height: 80,
  },
  buttons: {
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
  disabledButton: {
    backgroundColor: Colors.textSecondary,
  },
  payButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
}); 