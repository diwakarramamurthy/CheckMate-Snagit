import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface PropertyConfig {
  property_name: string;
  property_address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  parking_spots: number;
  has_kitchen: boolean;
}

interface Inspection {
  id: string;
  property_config: PropertyConfig;
  inspection_date: string;
  status: string;
  checklist_items: any[];
  inspector_name?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInspections = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/inspections`);
      if (!response.ok) throw new Error('Failed to fetch inspections');
      const data = await response.json();
      setInspections(data);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      Alert.alert('Error', 'Failed to load inspections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInspections();
  };

  const handleDeleteInspection = (id: string) => {
    Alert.alert(
      'Delete Inspection',
      'Are you sure you want to delete this inspection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_URL}/api/inspections/${id}`,
                { method: 'DELETE' }
              );
              if (!response.ok) throw new Error('Failed to delete');
              fetchInspections();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete inspection');
            }
          },
        },
      ]
    );
  };

  const getProgress = (inspection: Inspection) => {
    const total = inspection.checklist_items.length;
    const completed = inspection.checklist_items.filter(
      (item) => item.status !== 'pending'
    ).length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading inspections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CheckMate</Text>
          <Text style={styles.headerSubtitle}>Property Inspection</Text>
        </View>
        <Ionicons name="checkmark-circle" size={40} color="#3b82f6" />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {inspections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyText}>No inspections yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first inspection to get started
            </Text>
          </View>
        ) : (
          inspections.map((inspection) => {
            const progress = getProgress(inspection);
            return (
              <TouchableOpacity
                key={inspection.id}
                style={styles.card}
                onPress={() => router.push(`/inspection/${inspection.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.propertyName}>
                      {inspection.property_config.property_name}
                    </Text>
                    <Text style={styles.propertyAddress}>
                      {inspection.property_config.property_address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteInspection(inspection.id)}
                    onPressIn={(e) => e.stopPropagation()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ zIndex: 10 }}
                  >
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={16} color="#6b7280" />
                    <Text style={styles.infoText}>
                      {inspection.property_config.bedrooms} BR •{' '}
                      {inspection.property_config.bathrooms} BA
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text style={styles.infoText}>
                      {new Date(inspection.inspection_date).toLocaleDateString()}
                    </Text>
                  </View>
                  {inspection.inspector_name && (
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={16} color="#6b7280" />
                      <Text style={styles.infoText}>
                        {inspection.inspector_name}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>
                      Progress: {progress.completed}/{progress.total}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(inspection.status),
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {inspection.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress.percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/new-inspection')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});