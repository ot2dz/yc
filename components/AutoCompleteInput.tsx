import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Search, User, X } from 'lucide-react-native';
import Colors from '../constants/colors';
import { Customer } from '../types';

interface AutoCompleteInputProps {
  customers: Customer[];
  value: string;
  onChangeText: (text: string) => void;
  onSelectCustomer: (customer: Customer | null) => void;
  placeholder?: string;
  error?: string;
}

export default function AutoCompleteInput({
  customers,
  value,
  onChangeText,
  onSelectCustomer,
  placeholder = "اسم العميل",
  error,
}: AutoCompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // فلترة العملاء حسب النص المدخل
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(value.toLowerCase()) && 
    value.length > 0
  );

  // إظهار الاقتراحات عند الكتابة
  useEffect(() => {
    if (value.length > 0 && !selectedCustomer) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [value, selectedCustomer]);

  // اختيار عميل من الاقتراحات
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChangeText(customer.name);
    onSelectCustomer(customer);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // مسح الاختيار
  const handleClearSelection = () => {
    setSelectedCustomer(null);
    onChangeText('');
    onSelectCustomer(null);
    setShowSuggestions(false);
  };

  // تغيير النص
  const handleTextChange = (text: string) => {
    if (selectedCustomer) {
      setSelectedCustomer(null);
      onSelectCustomer(null);
    }
    onChangeText(text);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <View style={styles.iconContainer}>
          {selectedCustomer ? (
            <User size={20} color={Colors.success} />
          ) : (
            <Search size={20} color={Colors.textSecondary} />
          )}
        </View>
        
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          onFocus={() => {
            if (value.length > 0 && !selectedCustomer) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {(value.length > 0 || selectedCustomer) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSelection}
          >
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* رسالة الخطأ */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* حالة العميل */}
      {selectedCustomer && (
        <View style={styles.selectedCustomer}>
          <Text style={styles.selectedCustomerText}>
            ✓ عميل موجود: {selectedCustomer.name}
          </Text>
          <Text style={styles.selectedCustomerPhone}>
            {selectedCustomer.phone}
          </Text>
        </View>
      )}

      {!selectedCustomer && value.length > 0 && filteredCustomers.length === 0 && (
        <View style={styles.newCustomer}>
          <Text style={styles.newCustomerText}>
            + عميل جديد: {value}
          </Text>
        </View>
      )}

      {/* قائمة الاقتراحات */}
      {showSuggestions && filteredCustomers.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsScrollView}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {filteredCustomers.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectCustomer(item)}
              >
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionPhone}>{item.phone}</Text>
                </View>
                <User size={16} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
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
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'right',
  },
  clearButton: {
    marginLeft: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  selectedCustomer: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  selectedCustomerText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCustomerPhone: {
    color: Colors.textWhite,
    fontSize: 12,
    marginTop: 2,
  },
  newCustomer: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  newCustomerText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 150,
    zIndex: 2000,
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsScrollView: {
    maxHeight: 150,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  suggestionPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
}); 