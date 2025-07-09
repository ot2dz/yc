import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Calendar, DollarSign, Phone, FileText } from 'lucide-react-native';
import Colors from '../constants/colors';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'phone' | 'number' | 'currency' | 'date' | 'multiline';
  onPress?: () => void;
  icon?: React.ReactNode;
  rightText?: string;
}

export default function FormField({
  label,
  error,
  required = false,
  type = 'text',
  onPress,
  icon,
  rightText,
  ...props
}: FormFieldProps) {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'phone':
        return <Phone size={20} color={Colors.textSecondary} />;
      case 'currency':
      case 'number':
        return <DollarSign size={20} color={Colors.textSecondary} />;
      case 'date':
        return <Calendar size={20} color={Colors.textSecondary} />;
      case 'multiline':
        return <FileText size={20} color={Colors.textSecondary} />;
      default:
        return null;
    }
  };

  const getKeyboardType = () => {
    switch (type) {
      case 'phone':
        return 'phone-pad';
      case 'number':
      case 'currency':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const containerStyle = [
    styles.inputContainer,
    error && styles.inputError,
    type === 'multiline' && styles.multilineContainer,
  ];

  const inputStyle = [
    styles.input,
    type === 'multiline' && styles.multilineInput,
  ];

  const content = (
    <View style={containerStyle}>
      {getIcon() && (
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
      )}
      
      <TextInput
        style={inputStyle}
        keyboardType={getKeyboardType()}
        textAlign="right"
        textAlignVertical={type === 'multiline' ? 'top' : 'center'}
        multiline={type === 'multiline'}
        numberOfLines={type === 'multiline' ? 4 : 1}
        {...props}
      />
      
      {rightText && (
        <Text style={styles.rightText}>{rightText}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  required: {
    color: Colors.error,
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
  multilineContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
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
  multilineInput: {
    minHeight: 80,
  },
  rightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
}); 