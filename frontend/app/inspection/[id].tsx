import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChecklistItem {
  item_id: string;
  category: string;
  item_name: string;
  status: string;
  notes?: string;
  photos: string[];
  checked_at?: string;
}

interface Inspection {
  id: string;
  property_config: any;
  inspection_date: string;
  status: string;
  checklist_items: ChecklistItem[];
  inspector_name?: string;
}

export default function InspectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchInspection = async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/inspections/${id}`
      );
      if (!response.ok) throw new Error('Failed to fetch inspection');
      const data = await response.json();
      setInspection(data);
      
      // Expand all categories by default
      const categories = new Set(data.checklist_items.map((item: ChecklistItem) => item.category));
      setExpandedCategories(categories);
    } catch (error) {
      console.error('Error fetching inspection:', error);
      Alert.alert('Error', 'Failed to load inspection details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleItemPress = (item: ChecklistItem) => {
    router.push({
      pathname: '/item-detail',
      params: {
        inspectionId: id as string,
        itemId: item.item_id,
        category: item.category,
        itemName: item.item_name,
        status: item.status,
        notes: item.notes || '',
        photos: JSON.stringify(item.photos || []),
      },
    });
  };

  const handleCompleteInspection = async () => {
    Alert.alert(
      'Complete Inspection',
      'Mark this inspection as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_URL}/api/inspections/${id}`,
                {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'completed' }),
                }
              );
              if (!response.ok) throw new Error('Failed to update');
              fetchInspection();
              Alert.alert('Success', 'Inspection marked as completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to update inspection status');
            }
          },
        },
      ]
    );
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Success', `File saved to ${downloadResult.uri}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleExportPDF = async () => {
    Alert.alert('Generating PDF', 'Please wait...');
    const url = `${EXPO_PUBLIC_BACKEND_URL}/api/inspections/${id}/pdf`;
    await downloadFile(url, `inspection_${id}.pdf`);
  };

  const handleExportExcel = async () => {
    Alert.alert('Generating Excel', 'Please wait...');
    const url = `${EXPO_PUBLIC_BACKEND_URL}/api/inspections/${id}/excel`;
    await downloadFile(url, `inspection_${id}.xlsx`);
  };

  const handleDeleteInspection = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/inspections/${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete');
      
      setShowDeleteConfirm(false);
      setDeleting(false);
      
      // Navigate back to home after successful delete
      router.replace('/');
    } catch (error) {
      console.error('Delete error:', error);
      setDeleting(false);
      setShowDeleteConfirm(false);
      Alert.alert('Error', 'Failed to delete inspection. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
      case 'fail':
        return <Ionicons name="close-circle" size={24} color="#ef4444" />;
      case 'needs_attention':
        return <Ionicons name="alert-circle" size={24} color="#f59e0b" />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color="#9ca3af" />;
    }
  };

  const getProgress = () => {
    if (!inspection) return { completed: 0, total: 0, percentage: 0 };
    const total = inspection.checklist_items.length;
    const completed = inspection.checklist_items.filter(
      (item) => item.status !== 'pending'
    ).length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const getCategoryStats = (category: string) => {
    if (!inspection) return { total: 0, completed: 0 };
    const items = inspection.checklist_items.filter(
      (item) => item.category === category
    );
    return {
      total: items.length,
      completed: items.filter((item) => item.status !== 'pending').length,
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading inspection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inspection) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Inspection not found</Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backToHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = getProgress();
  const categoriesMap = new Map<string, ChecklistItem[]>();
  inspection.checklist_items.forEach((item) => {
    if (!categoriesMap.has(item.category)) {
      categoriesMap.set(item.category, []);
    }
    categoriesMap.get(item.category)!.push(item);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection</Text>
        <TouchableOpacity
          onPress={() => setShowActionMenu(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenu}>
            <Text style={styles.actionMenuTitle}>Options</Text>
            
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                handleExportPDF();
              }}
            >
              <Ionicons name="document-text" size={24} color="#3b82f6" />
              <Text style={styles.actionMenuText}>Export as PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                handleExportExcel();
              }}
            >
              <Ionicons name="grid" size={24} color="#10b981" />
              <Text style={styles.actionMenuText}>Export as Excel</Text>
            </TouchableOpacity>

            <View style={styles.actionMenuDivider} />

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                handleDeleteInspection();
              }}
            >
              <Ionicons name="trash" size={24} color="#ef4444" />
              <Text style={[styles.actionMenuText, { color: '#ef4444' }]}>Delete Inspection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionMenuItem, styles.cancelButton]}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmDialog}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning" size={48} color="#ef4444" />
            </View>
            
            <Text style={styles.deleteTitle}>Delete Inspection?</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete this inspection? This action cannot be undone.
            </Text>

            <View style={styles.deleteButtonsRow}>
              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.cancelDialogButton]}
                onPress={() => !deleting && setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelDialogText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <View style={styles.propertyCard}>
          <Text style={styles.propertyName}>
            {inspection.property_config.property_name}
          </Text>
          <Text style={styles.propertyAddress}>
            {inspection.property_config.property_address}
          </Text>
          
          <View style={styles.propertyDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={20} color="#6b7280" />
              <Text style={styles.detailText}>
                {inspection.property_config.bedrooms} BR
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={20} color="#6b7280" />
              <Text style={styles.detailText}>
                {inspection.property_config.bathrooms} BA
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="sunny-outline" size={20} color="#6b7280" />
              <Text style={styles.detailText}>
                {inspection.property_config.balconies} Balconies
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Progress: {progress.completed}/{progress.total}
              </Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progress.percentage)}%
              </Text>
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
        </View>

        {Array.from(categoriesMap.entries()).map(([category, items]) => {
          const stats = getCategoryStats(category);
          const isExpanded = expandedCategories.has(category);
          
          return (
            <View key={category} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={24}
                    color="#6b7280"
                  />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                <Text style={styles.categoryStats}>
                  {stats.completed}/{stats.total}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.itemsList}>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.item_id}
                      style={styles.itemRow}
                      onPress={() => handleItemPress(item)}
                    >
                      <View style={styles.itemLeft}>
                        {getStatusIcon(item.status)}
                        <Text style={styles.itemName}>{item.item_name}</Text>
                      </View>
                      <View style={styles.itemRight}>
                        {item.photos && item.photos.length > 0 && (
                          <View style={styles.photoBadge}>
                            <Ionicons name="camera" size={14} color="#6b7280" />
                            <Text style={styles.photoBadgeText}>
                              {item.photos.length}
                            </Text>
                          </View>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#9ca3af"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {inspection.status !== 'completed' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteInspection}
          >
            <Ionicons name="checkmark-done" size={24} color="#fff" />
            <Text style={styles.completeButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  backToHomeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  propertyCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  propertyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
  categoryCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryStats: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoBadgeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
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
  completeButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  actionMenuText: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '500',
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  cancelButton: {
    marginTop: 8,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#6b7280',
    fontWeight: '600',
  },
});
