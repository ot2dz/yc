import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerBackgroundFetchAsync, checkStatusAsync } from '../utils/backgroundTasks';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncAllToSupabase } from '../utils/sync';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Setup background tasks and listeners
    const setupApp = async () => {
      await Notifications.requestPermissionsAsync();
      await registerBackgroundFetchAsync();
      await checkStatusAsync();
    };
    setupApp();

    const netInfoSubscription = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log("Internet connection detected, attempting to sync...");
        syncAllToSupabase();
      }
    });

    return () => {
      netInfoSubscription();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.textWhite,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="customer/add" options={{ title: 'إضافة عميل', presentation: 'modal' }} />
          <Stack.Screen name="debt/add" options={{ title: 'إضافة دين', presentation: 'modal' }} />
          <Stack.Screen name="customer/[id]" options={{ title: 'تفاصيل العميل' }} />
          <Stack.Screen name="debt/[id]" options={{ title: 'تفاصيل الدين' }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}