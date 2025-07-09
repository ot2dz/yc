import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { MessageCircle, Send, X, Phone, Edit3, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import { ReminderData } from '../types';

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  reminderData: ReminderData | null;
}

export default function ReminderModal({
  visible,
  onClose,
  reminderData,
}: ReminderModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!reminderData) return null;

  // إنشاء الرسالة الافتراضية
  const defaultMessage = `مرحباً ${reminderData.customerName}،

هذه رسالة تذكيرية من ${reminderData.shopName} لدفع الدين المتبقي.

المبلغ المستحق: ${formatCurrency(reminderData.totalDebt)}

نرجو منك التواصل معنا لترتيب موعد الدفع.

شكراً لك على تعاملك الكريم معنا.`;

  const finalMessage = isEditing && customMessage ? customMessage : defaultMessage;

  // إرسال الرسالة عبر تطبيق الرسائل
  const handleSendSms = async () => {
    try {
      const phoneNumber = reminderData.customerPhone.replace(/\s/g, '');
      const message = encodeURIComponent(finalMessage);
      
      let smsUrl = '';
      
      if (Platform.OS === 'ios') {
        smsUrl = `sms:${phoneNumber}&body=${message}`;
      } else {
        smsUrl = `sms:${phoneNumber}?body=${message}`;
      }
      
      const canOpenUrl = await Linking.canOpenURL(smsUrl);
      
      if (canOpenUrl) {
        await Linking.openURL(smsUrl);
        onClose();
      } else {
        Alert.alert('خطأ', 'لا يمكن فتح تطبيق الرسائل');
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح تطبيق الرسائل');
    }
  };

  // نسخ الرسالة إلى الحافظة
  const handleCopyMessage = async () => {
    try {
      await Clipboard.setStringAsync(finalMessage);
      Alert.alert('تم النسخ', 'تم نسخ الرسالة إلى الحافظة');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في نسخ الرسالة');
    }
  };

  // الاتصال بالعميل
  const handleCall = async () => {
    try {
      const phoneNumber = reminderData.customerPhone.replace(/\s/g, '');
      const callUrl = `tel:${phoneNumber}`;
      
      const canOpenUrl = await Linking.canOpenURL(callUrl);
      
      if (canOpenUrl) {
        await Linking.openURL(callUrl);
      } else {
        Alert.alert('خطأ', 'لا يمكن فتح تطبيق الاتصال');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح تطبيق الاتصال');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modal}>
            {/* العنوان */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MessageCircle size={32} color={Colors.primary} />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>إرسال تذكير</Text>
                <Text style={styles.subtitle}>{reminderData.customerName}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* معلومات العميل */}
            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الاسم:</Text>
                <Text style={styles.infoValue}>{reminderData.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الهاتف:</Text>
                <Text style={styles.infoValue}>{reminderData.customerPhone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>المبلغ المستحق:</Text>
                <Text style={[styles.infoValue, styles.debtAmount]}>
                  {formatCurrency(reminderData.totalDebt)}
                </Text>
              </View>
            </View>

            {/* الرسالة */}
            <View style={styles.messageSection}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageTitle}>نص الرسالة</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setIsEditing(!isEditing);
                    if (!isEditing) {
                      setCustomMessage(defaultMessage);
                    }
                  }}
                >
                  <Edit3 size={16} color={Colors.primary} />
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'إلغاء التعديل' : 'تخصيص الرسالة'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <TextInput
                  style={styles.messageInput}
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  multiline
                  numberOfLines={8}
                  placeholder="اكتب رسالتك المخصصة..."
                  placeholderTextColor={Colors.textSecondary}
                  textAlignVertical="top"
                />
              ) : (
                <ScrollView style={styles.messagePreview}>
                  <Text style={styles.messageText}>{finalMessage}</Text>
                </ScrollView>
              )}
            </View>

            {/* الأزرار */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendSms}
              >
                <Send size={20} color={Colors.textWhite} />
                <Text style={styles.sendButtonText}>إرسال رسالة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCall}
              >
                <Phone size={20} color={Colors.primary} />
                <Text style={styles.callButtonText}>اتصال</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyMessage}
              >
                <Copy size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  customerInfo: {
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
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  debtAmount: {
    color: Colors.error,
    fontSize: 16,
  },
  messageSection: {
    marginBottom: 20,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 12,
    marginLeft: 4,
  },
  messageInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    minHeight: 150,
  },
  messagePreview: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    maxHeight: 200,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  callButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  callButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  copyButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
}); 