import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Link } from 'expo-router';
import { Search, Plus, Phone, DollarSign } from 'lucide-react-native';
import Colors from '../../constants/colors';
import { useAppStore } from '../../store/appStore';
import { formatCurrency } from '../../utils/dateUtils';
import { Customer } from '../../types';

export default function CustomersScreen() {
  const { customers, getCustomerDebts, getRemainingAmount } = useAppStore();
  const [searchText, setSearchText] = useState('');

  // فلترة العملاء حسب البحث
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone.includes(searchText)
  );

  // حساب إجمالي الديون لكل عميل
  const getCustomerTotalDebt = (customerId: string) => {
    const customerDebts = getCustomerDebts(customerId);
    return customerDebts
      .filter(debt => !debt.is_paid)
      .reduce((total, debt) => total + getRemainingAmount(debt), 0);
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const totalDebt = getCustomerTotalDebt(item.id);
    
    return (
      <Link href={`/customer/${item.id}`} asChild>
        <TouchableOpacity style={styles.customerItem}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.customerMeta}>
              <Phone size={16} color={Colors.textSecondary} />
              <Text style={styles.customerPhone}>{item.phone}</Text>
            </View>
          </View>
          <View style={styles.customerDebt}>
            <DollarSign size={16} color={totalDebt > 0 ? Colors.error : Colors.success} />
            <Text style={[
              styles.debtAmount,
              { color: totalDebt > 0 ? Colors.error : Colors.success }
            ]}>
              {formatCurrency(totalDebt)}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* شريط البحث */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="البحث عن عميل..."
            placeholderTextColor={Colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* قائمة العملاء */}
      {filteredCustomers.length > 0 ? (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchText ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {searchText ? 'جرب البحث بكلمة أخرى' : 'ابدأ بإضافة عميل جديد'}
          </Text>
        </View>
      )}

      {/* زر إضافة عميل */}
      <Link href="/customer/add" asChild>
        <TouchableOpacity style={styles.fab}>
          <Plus size={24} color={Colors.textWhite} />
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    textAlign: 'right',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  customerDebt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
}); 