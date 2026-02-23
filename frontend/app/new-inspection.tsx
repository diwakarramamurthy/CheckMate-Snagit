import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function NewInspectionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_name: '',
    property_address: '',
    property_type: 'apartment',
    bedrooms: '2',
    bathrooms: '2',
    balconies: '1',
    parking_spots: '1',
    has_kitchen: true,
    inspector_name: '',
  });

  const handleCreate = async () => {
    if (!formData.property_name.trim() || !formData.property_address.trim()) {
      Alert.alert('Error', 'Please fill in property name and address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/inspections`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_config: {
              property_name: formData.property_name,
              property_address: formData.property_address,
              property_type: formData.property_type,
              bedrooms: parseInt(formData.bedrooms) || 0,
              bathrooms: parseInt(formData.bathrooms) || 0,
              balconies: parseInt(formData.balconies) || 0,
              parking_spots: parseInt(formData.parking_spots) || 0,
              has_kitchen: formData.has_kitchen,
            },
            inspector_name: formData.inspector_name || null,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to create inspection');
      }
      
      const data = await response.json();
      console.log('Inspection created:', data.id);
      
      // Navigate directly to the inspection detail page
      router.push(`/inspection/${data.id}`);
    } catch (error) {
      console.error('Error creating inspection:', error);
      Alert.alert('Error', 'Failed to create inspection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Inspection</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Information</Text>

            <Text style={styles.label}>Property Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.property_name}
              onChangeText={(text) =>
                setFormData({ ...formData, property_name: text })
              }
              placeholder="e.g., Skyview Apartments Unit 304"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.property_address}
              onChangeText={(text) =>
                setFormData({ ...formData, property_address: text })
              }
              placeholder="Full property address"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Property Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  formData.property_type === 'apartment' &&
                    styles.radioButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, property_type: 'apartment' })
                }
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={
                    formData.property_type === 'apartment'
                      ? '#3b82f6'
                      : '#6b7280'
                  }
                />
                <Text
                  style={[
                    styles.radioText,
                    formData.property_type === 'apartment' &&
                      styles.radioTextActive,
                  ]}
                >
                  Apartment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  formData.property_type === 'house' && styles.radioButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, property_type: 'house' })
                }
              >
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={
                    formData.property_type === 'house' ? '#3b82f6' : '#6b7280'
                  }
                />
                <Text
                  style={[
                    styles.radioText,
                    formData.property_type === 'house' && styles.radioTextActive,
                  ]}
                >
                  House
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bedrooms}
                  onChangeText={(text) =>
                    setFormData({ ...formData, bedrooms: text })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bathrooms}
                  onChangeText={(text) =>
                    setFormData({ ...formData, bathrooms: text })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Balconies</Text>
                <TextInput
                  style={styles.input}
                  value={formData.balconies}
                  onChangeText={(text) =>
                    setFormData({ ...formData, balconies: text })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Parking Spots</Text>
                <TextInput
                  style={styles.input}
                  value={formData.parking_spots}
                  onChangeText={(text) =>
                    setFormData({ ...formData, parking_spots: text })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setFormData({ ...formData, has_kitchen: !formData.has_kitchen })
              }
            >
              <Ionicons
                name={
                  formData.has_kitchen
                    ? 'checkbox'
                    : 'square-outline'
                }
                size={24}
                color="#3b82f6"
              />
              <Text style={styles.checkboxLabel}>Has Kitchen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspector Details</Text>
            <Text style={styles.label}>Inspector Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.inspector_name}
              onChangeText={(text) =>
                setFormData({ ...formData, inspector_name: text })
              }
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Create Inspection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  radioButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  radioText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  radioTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});