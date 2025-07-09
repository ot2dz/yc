import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { Save, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { useAppStore } from '../../store/appStore';
import { Customer } from '../../types';
import { formatDate, generateId } from '../../utils/dateUtils';
import AutoCompleteInput from '../../components/AutoCompleteInput';
import FormField from '../../components/FormField';

interface FormData {
  customerName: string;
  customerPhone: string;
  amount: string;
  date: Date;
  notes: string;
}

interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  amount?: string;
}

export default function AddDebtScreen() {
  const { customerId } = useLocalSearchParams();
  const { customers, addCustomer, addDebt } = useAppStore();
  const insets = useSafeAreaInsets();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerPhone: '',
    amount: '',
    date: new Date(),
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // تحديد العميل تلقائياً إذا كان customerId موجود
  useEffect(() => {
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerName: customer.name,
          customerPhone: customer.phone,
        }));
      }
    }
  }, [customerId, customers]);

  // مسح الأخطاء عند تغيير البيانات
  useEffect(() => {
    if (errors.customerName && formData.customerName) {
      setErrors(prev => ({ ...prev, customerName: undefined }));
    }
    if (errors.amount && formData.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
    if (errors.customerPhone && formData.customerPhone) {
      setErrors(prev => ({ ...prev, customerPhone: undefined }));
    }
  }, [formData.customerName, formData.amount, formData.customerPhone]);

  // التحقق من صحة البيانات
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'اسم العميل مطلوب';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'مبلغ الدين مطلوب';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'يجب أن يكون المبلغ رقماً موجباً';
      }
    }

    // إذا كان عميل جديد ولم يدخل رقم الهاتف
    if (!selectedCustomer && !formData.customerPhone.trim()) {
      newErrors.customerPhone = 'رقم الهاتف مطلوب للعميل الجديد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
   const currentDate = selectedDate || formData.date;
   setShowDatePicker(Platform.OS === 'ios');
   setFormData(prev => ({ ...prev, date: currentDate }));
 };
  // حفظ الدين
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let customerId = selectedCustomer?.id;

      // إنشاء عميل جديد إذا لم يكن موجوداً
      if (!selectedCustomer) {
        const newCustomer = addCustomer({
          name: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
        });
        customerId = newCustomer.id; // Get the correct ID from the returned customer
      }

      // إضافة الدين
      addDebt({
        customer_id: customerId!,
        amount: parseFloat(formData.amount),
        date: formData.date.getTime(),
        notes: formData.notes.trim(),
      });

      Alert.alert(
        'تم الحفظ',
        'تم إضافة الدين بنجاح',
        [
          {
            text: 'موافق',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving debt:", error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // إلغاء العملية
  const handleCancel = () => {
    Alert.alert(
      'إلغاء العملية',
      'هل تريد إلغاء إضافة الدين؟',
      [
        { text: 'استمرار', style: 'cancel' },
        { 
          text: 'إلغاء', 
          style: 'destructive',
          onPress: () => router.back() 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* العنوان */}
          <View style={styles.header}>
            <Text style={styles.title}>إضافة دين جديد</Text>
            <Text style={styles.subtitle}>
              {customerId ? `إضافة دين للعميل: ${selectedCustomer?.name}` : 'ابحث عن عميل موجود أو أضف عميل جديد'}
            </Text>
          </View>

          {/* حقل اسم العميل مع البحث التلقائي */}
          {!customerId && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>معلومات العميل</Text>
              
              <AutoCompleteInput
                customers={customers}
                value={formData.customerName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, customerName: text }))}
                onSelectCustomer={setSelectedCustomer}
                placeholder="اكتب اسم العميل..."
                error={errors.customerName}
              />

              {/* حقل رقم الهاتف - يظهر فقط للعميل الجديد */}
              {!selectedCustomer && formData.customerName.length > 0 && (
                <FormField
                  label="رقم الهاتف"
                  type="phone"
                  required
                  value={formData.customerPhone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, customerPhone: text }))}
                  placeholder="05xxxxxxxx"
                  error={errors.customerPhone}
                  maxLength={10}
                />
              )}
            </View>
          )}

          {/* معلومات العميل المحدد */}
          {customerId && selectedCustomer && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>معلومات العميل</Text>
              <View style={styles.selectedCustomerInfo}>
                <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                <Text style={styles.selectedCustomerPhone}>{selectedCustomer.phone}</Text>
              </View>
            </View>
          )}

          {/* معلومات الدين */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>معلومات الدين</Text>
            
            <FormField
              label="مبلغ الدين"
              type="currency"
              required
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              placeholder="0"
              error={errors.amount}
              rightText="دج"
            />

            <FormField
              label="تاريخ الدين"
              type="date"
              value={formatDate(formData.date.getTime())}
              onPress={() => setShowDatePicker(true)}
              editable={false}
            />

            {showDatePicker && (
             <DateTimePicker
               testID="dateTimePicker"
               value={formData.date}
               mode="date"
               is24Hour={true}
               display="default"
               onChange={onDateChange}
               maximumDate={new Date()} // لا يمكن اختيار تاريخ مستقبلي
             />
           )}

            <FormField
              label="ملاحظات"
              type="multiline"
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="ملاحظات إضافية (اختياري)"
              maxLength={200}
            />
          </View>

          {/* معاينة الدين */}
          {formData.customerName && formData.amount && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>معاينة الدين</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>العميل:</Text>
                  <Text style={styles.previewValue}>
                    {formData.customerName}
                    {selectedCustomer ? ' (موجود)' : ' (جديد)'}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>المبلغ:</Text>
                  <Text style={[styles.previewValue, styles.amountValue]}>
                    {formData.amount} دج
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>التاريخ:</Text>
                  <Text style={styles.previewValue}>
                    {formatDate(formData.date.getTime())}
                  </Text>
                </View>
                {formData.notes && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>ملاحظات:</Text>
                    <Text style={styles.previewValue}>{formData.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

        </ScrollView>

        {/* أزرار العمليات */}
        <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Save size={20} color={Colors.textWhite} />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ الدين'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <X size={20} color={Colors.textSecondary} />
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'right',
  },
  previewSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'right',
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  amountValue: {
    color: Colors.error,
    fontWeight: 'bold',
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
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
  },
  saveButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedCustomerInfo: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectedCustomerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textWhite,
    marginBottom: 4,
  },
  selectedCustomerPhone: {
    fontSize: 14,
    color: Colors.textWhite,
    opacity: 0.9,
  },
}); 