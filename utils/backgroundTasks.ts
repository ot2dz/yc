import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/appStore';

// اسم المهمة
const DEBT_REMINDER_TASK = 'DEBT_REMINDER_TASK';

// ✅ 1. تعريف المهمة في الخلفية
TaskManager.defineTask(DEBT_REMINDER_TASK, async () => {
  try {
    const {
      debts,
      reminderSettings,
      customers,
      updateLastReminderSent,
    } = useAppStore.getState();

    if (!reminderSettings.overdueNotificationsEnabled) {
      console.log('🔕 التذكيرات غير مفعلة.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const { overduePeriodDays } = reminderSettings;
    const unpaidDebts = debts.filter((d) => !d.is_paid);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    let notificationsSent = 0;

    for (const debt of unpaidDebts) {
      const debtAge = now - debt.date;
      const isOverdue = debtAge > overduePeriodDays * oneDay;
      const reminderAlreadySentToday =
        debt.last_reminder_sent &&
        now - debt.last_reminder_sent < oneDay;

      if (isOverdue && !reminderAlreadySentToday) {
        const customer = customers.find((c) => c.id === debt.customer_id);
        const customerName = customer ? customer.name : 'عميل غير معروف';

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📌 تذكير بدين متأخر',
            body: `لديك دين متأخر لـ ${customerName} منذ أكثر من ${overduePeriodDays} يوم.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: 'timeInterval',
            seconds: 5,
            repeats: false,
          } as Notifications.TimeIntervalTriggerInput,
        });

        updateLastReminderSent(debt.id, now);
        notificationsSent++;
        console.log(`🔔 تم إرسال إشعار للعميل: ${customerName}`);
      }
    }

    return notificationsSent > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('❌ خطأ في تنفيذ مهمة الخلفية:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ✅ 2. تسجيل المهمة في الخلفية
export async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(DEBT_REMINDER_TASK, {
      minimumInterval: 15 * 60, // كل 15 دقيقة
      stopOnTerminate: false, // أندرويد فقط
      startOnBoot: true, // أندرويد فقط
    });
    console.log('✅ تم تسجيل المهمة في الخلفية');
  } catch (error) {
    console.error('❌ فشل في تسجيل المهمة:', error);
  }
}

// ✅ 3. إلغاء تسجيل المهمة
export async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(DEBT_REMINDER_TASK);
    console.log('🛑 تم إلغاء تسجيل المهمة');
  } catch (error) {
    console.error('❌ فشل في إلغاء تسجيل المهمة:', error);
  }
}

// ✅ 4. التحقق من حالة المهمة
export async function checkStatusAsync() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(DEBT_REMINDER_TASK);

    let statusLabel = 'unknown';
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        statusLabel = 'Restricted';
        break;
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        statusLabel = 'Denied';
        break;
      case BackgroundFetch.BackgroundFetchStatus.Available:
        statusLabel = 'Available';
        break;
    }

    console.log('📡 حالة Background Fetch:', statusLabel);
    console.log('✅ هل المهمة مسجلة؟', isRegistered);
  } catch (error) {
    console.error('❌ فشل في التحقق من حالة Background Fetch:', error);
  }
}
