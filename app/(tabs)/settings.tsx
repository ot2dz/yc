import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Bell, Store, MessageCircle, Smartphone, Save, Info, BarChart3, UploadCloud, SlidersHorizontal, RefreshCw, AlertTriangle, FileText } from 'lucide-react-native';
import { Link, useNavigation } from 'expo-router';
import Colors from '../../constants/colors';
import { useAppStore } from '../../store/appStore';
import { syncAllToSupabase } from '../../utils/sync';

// Helper Components for a cleaner structure
interface SettingsCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, children, icon: Icon }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {Icon && <Icon size={20} color={Colors.primary} />}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>
      {children}
    </View>
  </View>
);

interface SettingsRowProps {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, children, isLast = false }) => (
  <View style={[styles.row, !isLast && styles.rowSeparator]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowControl}>{children}</View>
  </View>
);

const analitycs = () => {
  return (
    <Link href="/reports" asChild>
      <TouchableOpacity style={styles.reportButton}>
        <View style={styles.reportButtonContent}>
          <View style={styles.reportIcon}>
            <BarChart3 size={24} color={Colors.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>عرض التقارير</Text>
            <Text style={styles.reportDescription}>
              التقارير الشهرية والإحصائيات المفصلة
            </Text>
          </View>
          <FileText size={20} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Link>
  )
}

// Main Screen Component
export default function SettingsScreen() {
  const navigation = useNavigation();
  const { reminderSettings, updateReminderSettings } = useAppStore();
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [settings, setSettings] = useState({
    enabled: reminderSettings.enabled,
    shopName: reminderSettings.shopName,
    reminderMessage: reminderSettings.reminderMessage,
    autoOpenSms: reminderSettings.autoOpenSms,
    overdueNotificationsEnabled: reminderSettings.overdueNotificationsEnabled,
    overduePeriodDays: (reminderSettings.overduePeriodDays ?? 30).toString(),
  });

  const updateSetting = (key: keyof typeof settings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (!hasChanges) setHasChanges(true);
  };

  const handleSave = () => {
    if (!settings.shopName.trim()) {
      Alert.alert('خطأ', 'يجب إدخال اسم المتجر');
      return;
    }
    const period = parseInt(settings.overduePeriodDays, 10);
    if (isNaN(period) || period <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال عدد أيام صحيح وأكبر من صفر للتنبيهات.');
      return;
    }

    updateReminderSettings({
      ...settings,
      overduePeriodDays: period,
    });

    setHasChanges(false);
    Alert.alert('تم الحفظ', 'تم حفظ الإعدادات بنجاح');
  };

  const resetToDefault = () => {
    Alert.alert(
      'إعادة تعيين الإعدادات',
      'هل أنت متأكد أنك تريد إعادة جميع الإعدادات إلى قيمها الافتراضية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'إعادة تعيين',
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              enabled: true,
              shopName: 'متجر يوسف للأقمشة',
              reminderMessage: 'مرحباً {name}، هذه رسالة تذكيرية من {shopName} لدفع الدين المتبقي: {amount}. شكراً لك على تعاملك الكريم معنا.',
              autoOpenSms: true,
              overdueNotificationsEnabled: true,
              overduePeriodDays: '30',
            };
            setSettings(defaultSettings);
            if (!hasChanges) setHasChanges(true);
          }
        },
      ]
    );
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncAllToSupabase();
      if (result) {
        Alert.alert('تمت المزامنة', 'تمت مزامنة البيانات مع الخادم بنجاح.');
      } else {
        Alert.alert('خطأ في المزامنة', 'فشلت مزامنة بعض البيانات. يرجى مراجعة سجلات الأخطاء.');
      }
    } catch (e) {
      console.error("Sync failed:", e);
      Alert.alert('خطأ فادح', 'حدث خطأ غير متوقع أثناء المزامنة.');
    } finally {
      setIsSyncing(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'الإعدادات',
      headerTitleStyle: { fontWeight: 'bold' },
      headerRight: () => hasChanges ? (
        <TouchableOpacity onPress={handleSave} style={{ marginRight: 15 }}>
          <Save size={24} color={Colors.primary} />
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, hasChanges, settings]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        
        {/* Sync and Reports Card */}
        <SettingsCard title="البيانات والتقارير" icon={BarChart3}>
          <TouchableOpacity style={styles.syncButton} onPress={handleManualSync} disabled={isSyncing}>
            <UploadCloud size={20} color={Colors.textWhite} />
            <Text style={styles.syncButtonText}>{isSyncing ? 'جاري المزامنة...' : 'مزامنة يدوية'}</Text>
          </TouchableOpacity>
          <View style={{marginTop: 10}}>{analitycs()}</View>
        </SettingsCard>
        
        {/* Reminder Settings Card */}
        <SettingsCard title="إعدادات رسائل التذكير" icon={MessageCircle}>
          <SettingsRow label="تفعيل رسائل التذكير">
            <Switch
              value={settings.enabled}
              onValueChange={value => updateSetting('enabled', value)}
              thumbColor={settings.enabled ? Colors.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: Colors.primaryLight }}
            />
          </SettingsRow>
          <SettingsRow label="فتح تطبيق الرسائل تلقائياً">
            <Switch
              value={settings.autoOpenSms}
              onValueChange={value => updateSetting('autoOpenSms', value)}
              disabled={!settings.enabled}
              thumbColor={settings.autoOpenSms ? Colors.primary : Platform.OS === 'android' ? '#f4f3f4' : ''}
              trackColor={{ false: '#767577', true: Colors.primaryLight }}
            />
          </SettingsRow>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>اسم المتجر</Text>
            <TextInput
              style={[styles.input, !settings.enabled && styles.disabledInput]}
              value={settings.shopName}
              onChangeText={value => updateSetting('shopName', value)}
              placeholder="اكتب اسم متجرك هنا"
              editable={settings.enabled}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>قالب رسالة التذكير</Text>
            <TextInput
              style={[styles.input, styles.textArea, !settings.enabled && styles.disabledInput]}
              value={settings.reminderMessage}
              onChangeText={value => updateSetting('reminderMessage', value)}
              placeholder="اكتب نص رسالتك هنا"
              multiline
              editable={settings.enabled}
            />
             <Text style={styles.helpText}>
              استخدم: {`{name}`} للاسم، {`{shopName}`} للمتجر، {`{amount}`} للمبلغ.
            </Text>
          </View>
        </SettingsCard>

        {/* Overdue Notifications Card */}
        <SettingsCard title="إشعارات الديون المتأخرة" icon={Bell}>
          <SettingsRow label="تفعيل إشعارات الديون المتأخرة">
             <Switch
              value={settings.overdueNotificationsEnabled}
              onValueChange={value => updateSetting('overdueNotificationsEnabled', value)}
              thumbColor={settings.overdueNotificationsEnabled ? Colors.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: Colors.primaryLight }}
            />
          </SettingsRow>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>تنبيه بعد (يوم)</Text>
            <TextInput
              style={[styles.input, !settings.overdueNotificationsEnabled && styles.disabledInput]}
              value={settings.overduePeriodDays}
              onChangeText={value => updateSetting('overduePeriodDays', value)}
              keyboardType="number-pad"
              editable={settings.overdueNotificationsEnabled}
            />
            <Text style={styles.helpText}>
              سيصلك إشعار بعد مرور هذه المدة على أي دين غير مسدد.
            </Text>
          </View>
        </SettingsCard>

         {/* General Settings */}
        <SettingsCard title="عام" icon={SlidersHorizontal}>
           <TouchableOpacity style={styles.actionButton} onPress={resetToDefault}>
              <RefreshCw size={20} color={Colors.error} />
              <Text style={[styles.actionButtonText, {color: Colors.error}]}>إعادة تعيين الإعدادات</Text>
           </TouchableOpacity>
        </SettingsCard>
        
        <View style={styles.footer}>
           <Info size={16} color={Colors.textSecondary} />
           <Text style={styles.footerText}>نظام إدارة ديون الأقمشة - إصدار 2.2.0</Text>
        </View>

      </ScrollView>

      {hasChanges && (
         <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={handleSave}>
            <Save size={24} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100, // For FAB spacing
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  cardContent: {
    //
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.text,
    flexShrink: 1,
    marginRight: 10,
  },
  rowControl: {
    flexShrink: 0,
  },
  inputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'right',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.textSecondary,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reportButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reportDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fab: {
    backgroundColor: Colors.success,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});