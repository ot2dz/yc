import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Target, 
  Clock, 
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import { useAppStore } from '../store/appStore';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { CustomerStats, PaymentTrend } from '../types';

const { width: screenWidth } = Dimensions.get('window');

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  
  const {
    getMonthlyCollectedReport,
    getTopCustomers,
    getPaymentTrends,
    getDebtsByStatus,
    getCollectionRate,
    getAverageDebtAmount,
    getAverageCollectionTime,
  } = useAppStore();

  // بيانات محسوبة
  const paymentTrends = useMemo(() => getPaymentTrends(6), []);
  const topCustomers = useMemo(() => getTopCustomers(5), []);
  const debtsByStatus = useMemo(() => getDebtsByStatus(), []);
  const collectionRate = useMemo(() => getCollectionRate(), []);
  const averageDebtAmount = useMemo(() => getAverageDebtAmount(), []);
  const averageCollectionTime = useMemo(() => getAverageCollectionTime(), []);

  // التقرير الشهري المحدد
  const selectedMonthReport = useMemo(() => {
    if (paymentTrends.length === 0) return null;
    const trend = paymentTrends[selectedMonthIndex];
    return getMonthlyCollectedReport(trend.year, trend.month);
  }, [selectedMonthIndex, paymentTrends]);

  // رسم بياني بسيط للاتجاهات
  const renderTrendChart = () => {
    if (paymentTrends.length === 0) return null;
    
    const maxAmount = Math.max(...paymentTrends.map(t => t.totalCollected));
    const chartHeight = 100;
    const barWidth = (screenWidth - 80) / paymentTrends.length;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {paymentTrends.map((trend, index) => {
            const barHeight = maxAmount > 0 ? (trend.totalCollected / maxAmount) * chartHeight : 0;
            const isSelected = index === selectedMonthIndex;
            
            return (
              <TouchableOpacity
                key={`${trend.year}-${trend.month}`}
                style={[styles.chartBar, { width: barWidth - 4 }]}
                onPress={() => setSelectedMonthIndex(index)}
              >
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: isSelected ? Colors.primary : Colors.primaryLight,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartBarLabel, isSelected && styles.selectedBarLabel]}>
                  {trend.monthName.substring(0, 3)}
                </Text>
                <Text style={[styles.chartBarValue, isSelected && styles.selectedBarValue]}>
                  {formatCurrency(trend.totalCollected)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // عرض إحصائيات العميل
  const renderCustomerStats = ({ item }: { item: CustomerStats }) => (
    <View style={styles.customerStatsCard}>
      <View style={styles.customerStatsHeader}>
        <View style={styles.customerAvatar}>
          <User size={20} color={Colors.primary} />
        </View>
        <View style={styles.customerStatsInfo}>
          <Text style={styles.customerStatsName}>{item.customer.name}</Text>
          <Text style={styles.customerStatsPhone}>{item.customer.phone}</Text>
        </View>
        <View style={styles.customerStatsNumbers}>
          <Text style={styles.customerStatsMainValue}>{formatCurrency(item.totalAmount)}</Text>
          <Text style={styles.customerStatsSubValue}>{item.debtCount} دين</Text>
        </View>
      </View>
      
      <View style={styles.customerStatsDetails}>
        <View style={styles.customerStatsRow}>
          <Text style={styles.customerStatsLabel}>مسدد:</Text>
          <Text style={[styles.customerStatsValue, { color: Colors.success }]}>
            {formatCurrency(item.totalPaid)}
          </Text>
        </View>
        
        <View style={styles.customerStatsRow}>
          <Text style={styles.customerStatsLabel}>متوسط الدين:</Text>
          <Text style={styles.customerStatsValue}>
            {formatCurrency(item.avgDebtAmount)}
          </Text>
        </View>
        
        {item.overdueDebts > 0 && (
          <View style={styles.customerStatsRow}>
            <Text style={styles.customerStatsLabel}>ديون متأخرة:</Text>
            <Text style={[styles.customerStatsValue, { color: Colors.error }]}>
              {item.overdueDebts}
            </Text>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>التقارير والإحصائيات</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* الإحصائيات العامة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإحصائيات العامة</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{collectionRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>معدل التحصيل</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <DollarSign size={20} color={Colors.warning} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(averageDebtAmount)}</Text>
              <Text style={styles.statLabel}>متوسط الدين</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Clock size={20} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{averageCollectionTime} يوم</Text>
              <Text style={styles.statLabel}>متوسط التحصيل</Text>
            </View>
          </View>
        </View>

        {/* حالة الديون */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حالة الديون</Text>
          
          <View style={styles.debtStatusContainer}>
            <View style={styles.debtStatusCard}>
              <View style={[styles.debtStatusIcon, { backgroundColor: Colors.successLight }]}>
                <CheckCircle size={20} color={Colors.success} />
              </View>
              <Text style={styles.debtStatusTitle}>مسددة</Text>
              <Text style={styles.debtStatusCount}>{debtsByStatus.paid.count}</Text>
              <Text style={styles.debtStatusAmount}>{formatCurrency(debtsByStatus.paid.amount)}</Text>
            </View>
            
            <View style={styles.debtStatusCard}>
              <View style={[styles.debtStatusIcon, { backgroundColor: Colors.warningLight }]}>
                <Clock size={20} color={Colors.warning} />
              </View>
              <Text style={styles.debtStatusTitle}>حالية</Text>
              <Text style={styles.debtStatusCount}>{debtsByStatus.current.count}</Text>
              <Text style={styles.debtStatusAmount}>{formatCurrency(debtsByStatus.current.amount)}</Text>
            </View>
            
            <View style={styles.debtStatusCard}>
              <View style={[styles.debtStatusIcon, { backgroundColor: Colors.errorLight }]}>
                <AlertTriangle size={20} color={Colors.error} />
              </View>
              <Text style={styles.debtStatusTitle}>متأخرة</Text>
              <Text style={styles.debtStatusCount}>{debtsByStatus.overdue.count}</Text>
              <Text style={styles.debtStatusAmount}>{formatCurrency(debtsByStatus.overdue.amount)}</Text>
            </View>
          </View>
        </View>

        {/* اتجاهات المدفوعات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اتجاهات المدفوعات (آخر 6 أشهر)</Text>
          
          {paymentTrends.length > 0 ? (
            <>
              {renderTrendChart()}
              
              {/* تفاصيل الشهر المحدد */}
              {selectedMonthReport && (
                <View style={styles.monthReportCard}>
                  <Text style={styles.monthReportTitle}>
                    {paymentTrends[selectedMonthIndex]?.monthName} {paymentTrends[selectedMonthIndex]?.year}
                  </Text>
                  
                  <View style={styles.monthReportStats}>
                    <View style={styles.monthReportStat}>
                      <Text style={styles.monthReportStatLabel}>المبلغ المحصل</Text>
                      <Text style={styles.monthReportStatValue}>
                        {formatCurrency(selectedMonthReport.totalCollected)}
                      </Text>
                    </View>
                    
                    <View style={styles.monthReportStat}>
                      <Text style={styles.monthReportStatLabel}>عدد المدفوعات</Text>
                      <Text style={styles.monthReportStatValue}>
                        {selectedMonthReport.paymentsCount}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>لا توجد بيانات مدفوعات</Text>
            </View>
          )}
        </View>

        {/* العملاء الأكثر تعاملاً */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>العملاء الأكثر تعاملاً</Text>
          
          {topCustomers.length > 0 ? (
            <FlatList
              data={topCustomers}
              renderItem={renderCustomerStats}
              keyExtractor={(item) => item.customer.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>لا توجد بيانات عملاء</Text>
            </View>
          )}
        </View>

        {/* مساحة إضافية في الأسفل */}
        <View style={{ height: 50 }} />
      </ScrollView>
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  debtStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  debtStatusCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debtStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  debtStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  debtStatusCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  debtStatusAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
  },
  barBackground: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedBarLabel: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  chartBarValue: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedBarValue: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  monthReportCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthReportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  monthReportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthReportStat: {
    alignItems: 'center',
  },
  monthReportStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  monthReportStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  customerStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerStatsInfo: {
    flex: 1,
  },
  customerStatsName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  customerStatsPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  customerStatsNumbers: {
    alignItems: 'flex-end',
  },
  customerStatsMainValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  customerStatsSubValue: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  customerStatsDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  customerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerStatsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  customerStatsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
}); 