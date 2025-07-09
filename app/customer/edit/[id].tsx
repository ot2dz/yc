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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Save, X, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../../constants/colors';
import { useAppStore } from '../../../store/appStore';
import FormField from '../../../components/FormField';
import { Customer } from '../../../types';

interface FormData {
  name: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams();
  const { customers, updateCustomer } = useAppStore();
  const insets = useSafeAreaInsets();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // تحميل بيانات العميل
  useEffect(() => {
    const foundCustomer = customers.find(c => c.id === id);
    if (foundCustomer) {
      setCustomer(foundCustomer);
      setFormData({
        name: foundCustomer.name,
        phone: foundCustomer.phone,
      });
    }
  }, [id, customers]);

  // مسح الأخطاء عند تغيير البيانات
  useEffect(() => {
    if (errors.name && formData.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
    if (errors.phone && formData.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  }, [formData.name, formData.phone]);

  // التحقق من صحة البيانات
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم العميل مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'اسم العميل يجب أن يكون حرفين على الأقل';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل';
    }

    // فحص إذا كان العميل موجود مسبقاً (باستثناء العميل الحالي)
    const existingCustomer = customers.find(customer => 
      customer.id !== id && (
        customer.name.toLowerCase() === formData.name.trim().toLowerCase() ||
        customer.phone === formData.phone.trim()
      )
    );

    if (existingCustomer) {
      if (existingCustomer.name.toLowerCase() === formData.name.trim().toLowerCase()) {
        newErrors.name = 'عميل بهذا الاسم موجود مسبقاً';
      }
      if (existingCustomer.phone === formData.phone.trim()) {
        newErrors.phone = 'عميل بهذا الرقم موجود مسبقاً';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // حفظ التعديلات
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      updateCustomer(id as string, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      Alert.alert(
        'تم الحفظ',
        'تم تعديل بيانات العميل بنجاح',
        [
          {
            text: 'موافق',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // إلغاء العملية
  const handleCancel = () => {
    const hasChanges = 
      formData.name.trim() !== customer?.name ||
      formData.phone.trim() !== customer?.phone;

    if (hasChanges) {
      Alert.alert(
        'إلغاء العملية',
        'هل تريد إلغاء التعديلات؟',
        [
          { text: 'استمرار', style: 'cancel' },
          { 
            text: 'إلغاء', 
            style: 'destructive',
            onPress: () => router.back() 
          },
        ]
      );
    } else {
      router.back();
    }
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
            <View style={styles.iconContainer}>
              <User size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>تعديل العميل</Text>
            <Text style={styles.subtitle}>
              تعديل بيانات العميل: {customer.name}
            </Text>
          </View>

          {/* النموذج */}
          <View style={styles.formSection}>
            <FormField
              label="اسم العميل"
              required
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="أدخل اسم العميل الكامل"
              error={errors.name}
              maxLength={50}
              autoFocus
            />

            <FormField
              label="رقم الهاتف"
              type="phone"
              required
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="05xxxxxxxx"
              error={errors.phone}
              maxLength={10}
            />
          </View>

          {/* معاينة البيانات */}
          {formData.name.trim() && formData.phone.trim() && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>معاينة البيانات المحدثة</Text>
              <View style={styles.previewCard}>
                <View style={styles.customerIcon}>
                  <User size={32} color={Colors.primary} />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{formData.name.trim()}</Text>
                  <Text style={styles.customerPhone}>{formData.phone.trim()}</Text>
                </View>
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
              {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  previewSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    fontSize: 14,
    color: Colors.textSecondary,
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
}); 