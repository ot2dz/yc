import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Link } from 'expo-router';
import { Plus, DollarSign, Users, AlertTriangle, Calendar } from 'lucide-react-native';
import Colors from '../../constants/colors';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatDateShort } from '../../utils/dateUtils';

export default function HomeScreen() {
  const { 
    customers, 
    getTotalUnpaidAmount, 
    getUnpaidDebts, 
    getOverdueDebts, 
    getRecentDebts,
    getCustomer,
    getRemainingAmount
  } = useAppStore();

  const totalUnpaid = getTotalUnpaidAmount();
  const unpaidDebts = getUnpaidDebts();
  const overdueDebts = getOverdueDebts();
  const recentDebts = getRecentDebts();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* كروت الإحصائيات */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <DollarSign size={24} color={Colors.textWhite} />
            <Text style={styles.statNumber}>{formatCurrency(totalUnpaid)}</Text>
            <Text style={styles.statLabel}>إجمالي الديون</Text>
          </View>
          
          <View style={styles.statCard}>
            <Users size={24} color={Colors.primary} />
            <Text style={[styles.statNumber, styles.darkNumber]}>{customers.length}</Text>
            <Text style={styles.statLabelDark}>العملاء</Text>
          </View>
          
          <View style={styles.statCard}>
            <AlertTriangle size={24} color={Colors.error} />
            <Text style={[styles.statNumber, styles.errorNumber]}>{overdueDebts.length}</Text>
            <Text style={styles.statLabelDark}>متأخرة</Text>
          </View>
        </View>

        {/* الديون الحديثة */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الديون الحديثة</Text>
            <Link href="/debt/add" asChild>
              <TouchableOpacity style={styles.addButton}>
                <Plus size={20} color={Colors.textWhite} />
                <Text style={styles.addButtonText}>إضافة دين</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {recentDebts.length > 0 ? (
            <View style={styles.debtsList}>
              {recentDebts.map((debt) => {
                const customer = getCustomer(debt.customer_id);
                const remainingAmount = getRemainingAmount(debt);
                return (
                  <Link key={debt.id} href={`/debt/${debt.id}`} asChild>
                    <TouchableOpacity style={styles.debtItem}>
                      <View style={styles.debtInfo}>
                        <Text style={styles.customerName}>{customer?.name}</Text>
                        <Text style={styles.debtAmount}>{formatCurrency(remainingAmount)}</Text>
                        {(typeof debt.amount_paid === 'number' ? debt.amount_paid : 0) > 0 && (
                          <Text style={styles.paidAmount}>
                            مسدد: {formatCurrency(typeof debt.amount_paid === 'number' ? debt.amount_paid : 0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.debtMeta}>
                        <Calendar size={16} color={Colors.textSecondary} />
                        <Text style={styles.debtDate}>{formatDateShort(debt.date)}</Text>
                      </View>
                    </TouchableOpacity>
                  </Link>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>لا توجد ديون حديثة</Text>
              <Text style={styles.emptyStateSubtext}>
                ابدأ بإضافة عملاء وديون جديدة
              </Text>
            </View>
          )}
        </View>

        {/* إجراءات سريعة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.quickActions}>
            <Link href="/customer/add" asChild>
              <TouchableOpacity style={styles.quickAction}>
                <Users size={24} color={Colors.primary} />
                <Text style={styles.quickActionText}>إضافة عميل</Text>
              </TouchableOpacity>
            </Link>
            
            <Link href="/debt/add" asChild>
              <TouchableOpacity style={styles.quickAction}>
                <DollarSign size={24} color={Colors.primary} />
                <Text style={styles.quickActionText}>إضافة دين</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

      </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textWhite,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  darkNumber: {
    color: Colors.primary,
  },
  errorNumber: {
    color: Colors.error,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textWhite,
    textAlign: 'center',
  },
  statLabelDark: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  debtsList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  debtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  debtInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  debtAmount: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 2,
  },
  paidAmount: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  debtMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickAction: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 8,
  },
}); 