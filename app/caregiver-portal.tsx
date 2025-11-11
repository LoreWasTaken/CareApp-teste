// app/caregiver-portal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { Plus, Users, Shield, Bell, Settings, Eye, CheckCircle, XCircle } from 'lucide-react-native';
import { useApp } from '../contexts/AppContext';
import { addCaregiver, getCaregiverDashboard, createAlertRule, getAlertRules } from './services/api';
import { Spacing, BorderRadius, FontSizes } from '../constants/colors';
import type { ThemeColors } from '../constants/colors';

interface CaregiverData {
  id: string;
  name: string;
  email: string;
  relationship: string;
  permissions: string[];
  is_authorized: boolean;
  created_at: string;
}

interface AlertRule {
  id: string;
  caregiver_id: string;
  rule_type: 'missed_dose' | 'low_inventory' | 'symptom_severity';
  condition: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  theme: ThemeColors;
}

export default function CaregiverPortalScreen() {
  const { appData, theme } = useApp();
  const [activeTab, setActiveTab] = useState<'caregivers' | 'alerts'>('caregivers');
  const [caregivers, setCaregivers] = useState<CaregiverData[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  
  // Add caregiver form state
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [caregiverRelationship, setCaregiverRelationship] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['view_adherence', 'view_inventory']);
  
  // Add alert form state
  const [selectedCaregiver, setSelectedCaregiver] = useState('');
  const [alertType, setAlertType] = useState<'missed_dose' | 'low_inventory' | 'symptom_severity'>('missed_dose');
  const [alertCondition, setAlertCondition] = useState('');

  // If theme is still not available, provide a fallback
  const safeTheme = theme || {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    disabled: '#D1D1D6',
    border: '#E5E5EA',
    backgroundDark: '#F2F2F7'
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashboardResponse, rulesResponse] = await Promise.all([
        getCaregiverDashboard(),
        getAlertRules()
      ]);

      if (dashboardResponse.caregivers) {
        setCaregivers(dashboardResponse.caregivers);
      }
      if (rulesResponse.alert_rules) {
        setAlertRules(rulesResponse.alert_rules);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load caregiver data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddCaregiver = async () => {
    if (!caregiverName.trim() || !caregiverEmail.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await addCaregiver({
        name: caregiverName.trim(),
        email: caregiverEmail.trim(),
        relationship: caregiverRelationship.trim() || 'family',
        permissions: selectedPermissions
      });

      if (response.caregiver) {
        Alert.alert('Success', 'Caregiver added successfully! They will receive an invitation email.');
        setShowAddCaregiver(false);
        setCaregiverName('');
        setCaregiverEmail('');
        setCaregiverRelationship('');
        setSelectedPermissions(['view_adherence', 'view_inventory']);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error adding caregiver:', error);
      Alert.alert('Error', 'Failed to add caregiver. Please try again.');
    }
  };

  const handleCreateAlertRule = async () => {
    if (!selectedCaregiver || !alertCondition.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const condition = alertType === 'missed_dose'
        ? { hours_missed: parseInt(alertCondition) || 2 }
        : alertType === 'low_inventory'
        ? { days_remaining: parseInt(alertCondition) || 7 }
        : { severity_threshold: parseInt(alertCondition) || 4 };

      const response = await createAlertRule({
        caregiver_id: selectedCaregiver,
        rule_type: alertType,
        condition,
        is_active: true
      });

      if (response.alert_rule) {
        Alert.alert('Success', 'Alert rule created successfully!');
        setShowAddAlert(false);
        setSelectedCaregiver('');
        setAlertCondition('');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating alert rule:', error);
      Alert.alert('Error', 'Failed to create alert rule. Please try again.');
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const fontSize = appData.user.largeText ? FontSizes.xxxl : FontSizes.xl;
  const bodyFontSize = appData.user.largeText ? FontSizes.xl : FontSizes.lg;
  const smallFontSize = appData.user.largeText ? FontSizes.lg : FontSizes.md;
  const styles = createStyles(safeTheme, fontSize, bodyFontSize, smallFontSize);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Caregiver Circle</Text>
        <Text style={styles.subtitle}>
          Manage trusted caregivers and configure smart alerts
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'caregivers' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('caregivers')}
        >
          <Users size={20} color={activeTab === 'caregivers' ? safeTheme.surface : safeTheme.primary} />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'caregivers' && styles.tabButtonTextActive
          ]}>
            Caregivers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'alerts' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('alerts')}
        >
          <Bell size={20} color={activeTab === 'alerts' ? safeTheme.surface : safeTheme.primary} />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'alerts' && styles.tabButtonTextActive
          ]}>
            Smart Alerts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'caregivers' ? (
          <View style={styles.tabContent}>
            {/* Add Caregiver Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddCaregiver(true)}
            >
              <Plus size={20} color={safeTheme.surface} />
              <Text style={styles.addButtonText}>Add Caregiver</Text>
            </TouchableOpacity>

            {/* Caregivers List */}
            {caregivers.length > 0 ? (
              <View style={styles.caregiverList}>
                {caregivers.map((caregiver) => (
                  <View key={caregiver.id} style={styles.caregiverCard}>
                    <View style={styles.caregiverInfo}>
                      <View style={styles.caregiverHeader}>
                        <Text style={styles.caregiverName}>{caregiver.name}</Text>
                        <View style={[
                          styles.authorizationBadge,
                          { backgroundColor: caregiver.is_authorized ? safeTheme.success : safeTheme.warning + '40' }
                        ]}>
                          {caregiver.is_authorized ? (
                            <CheckCircle size={16} color={safeTheme.success} />
                          ) : (
                            <XCircle size={16} color={safeTheme.warning} />
                          )}
                        </View>
                      </View>
                      
                      <Text style={styles.caregiverEmail}>{caregiver.email}</Text>
                      <Text style={styles.caregiverRelationship}>
                        Relationship: {caregiver.relationship}
                      </Text>
                      
                      <View style={styles.permissionsContainer}>
                        <Text style={styles.permissionsLabel}>Permissions:</Text>
                        <View style={styles.permissionsList}>
                          {caregiver.permissions.map((permission) => (
                            <View key={permission} style={styles.permissionBadge}>
                              <Text style={styles.permissionText}>
                                {permission.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.caregiverActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Eye size={16} color={safeTheme.primary} />
                        <Text style={styles.actionButtonText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Settings size={16} color={safeTheme.textSecondary} />
                        <Text style={styles.actionButtonText}>Settings</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color={safeTheme.textSecondary} />
                <Text style={styles.emptyStateText}>No caregivers added yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add trusted family members or friends to help monitor your health
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Add Alert Button */}
            {caregivers.length > 0 && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddAlert(true)}
              >
                <Plus size={20} color={safeTheme.surface} />
                <Text style={styles.addButtonText}>Create Alert Rule</Text>
              </TouchableOpacity>
            )}

            {/* Alert Rules List */}
            {alertRules.length > 0 ? (
              <View style={styles.alertRulesList}>
                {alertRules.map((rule) => {
                  const caregiver = caregivers.find(c => c.id === rule.caregiver_id);
                  const condition = JSON.parse(rule.condition);
                  
                  return (
                    <View key={rule.id} style={styles.alertRuleCard}>
                      <View style={styles.alertRuleHeader}>
                        <View style={styles.alertRuleInfo}>
                          <Text style={styles.alertRuleType}>
                            {rule.rule_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Text>
                          <Text style={styles.alertRuleCaregiver}>
                            for {caregiver?.name || 'Unknown'}
                          </Text>
                        </View>
                        <View style={[
                          styles.alertRuleStatus,
                          { backgroundColor: rule.is_active ? safeTheme.success : safeTheme.disabled }
                        ]}>
                          <Text style={styles.alertRuleStatusText}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.alertRuleCondition}>
                        <Text style={styles.alertRuleConditionText}>
                          {rule.rule_type === 'missed_dose' && `Alert if dose missed for ${condition.hours_missed}+ hours`}
                          {rule.rule_type === 'low_inventory' && `Alert if inventory below ${condition.days_remaining} days`}
                          {rule.rule_type === 'symptom_severity' && `Alert if symptom severity ≥ ${condition.severity_threshold}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Bell size={48} color={safeTheme.textSecondary} />
                <Text style={styles.emptyStateText}>No alert rules configured</Text>
                <Text style={styles.emptyStateSubtext}>
                  {caregivers.length > 0
                    ? 'Create your first alert rule to get notified about important events'
                    : 'Add a caregiver first to configure alert rules'
                  }
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Caregiver Modal */}
      <Modal visible={showAddCaregiver} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Caregiver</Text>
              <TouchableOpacity onPress={() => setShowAddCaregiver(false)}>
                <XCircle size={24} color={safeTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Caregiver name"
                  value={caregiverName}
                  onChangeText={setCaregiverName}
                  placeholderTextColor={safeTheme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="caregiver@email.com"
                  value={caregiverEmail}
                  onChangeText={setCaregiverEmail}
                  keyboardType="email-address"
                  placeholderTextColor={safeTheme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Relationship</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Daughter, Son, Spouse"
                  value={caregiverRelationship}
                  onChangeText={setCaregiverRelationship}
                  placeholderTextColor={safeTheme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Permissions</Text>
                <View style={styles.permissionsSelector}>
                  {['view_adherence', 'view_inventory', 'receive_alerts'].map((permission) => (
                    <TouchableOpacity
                      key={permission}
                      style={[
                        styles.permissionSelector,
                        selectedPermissions.includes(permission) && styles.permissionSelectorSelected
                      ]}
                      onPress={() => togglePermission(permission)}
                    >
                      <Text
                        style={[
                          styles.permissionSelectorText,
                          selectedPermissions.includes(permission) && styles.permissionSelectorTextSelected
                        ]}
                      >
                        {permission.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddCaregiver(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddCaregiver}>
                <Text style={styles.submitButtonText}>Add Caregiver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Alert Modal */}
      <Modal visible={showAddAlert} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Alert Rule</Text>
              <TouchableOpacity onPress={() => setShowAddAlert(false)}>
                <XCircle size={24} color={safeTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Caregiver *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.caregiverSelector}>
                    {caregivers.map((caregiver) => (
                      <TouchableOpacity
                        key={caregiver.id}
                        style={[
                          styles.caregiverSelectorItem,
                          selectedCaregiver === caregiver.id && styles.caregiverSelectorItemSelected
                        ]}
                        onPress={() => setSelectedCaregiver(caregiver.id)}
                      >
                        <Text
                          style={[
                            styles.caregiverSelectorItemText,
                            selectedCaregiver === caregiver.id && styles.caregiverSelectorItemTextSelected
                          ]}
                        >
                          {caregiver.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alert Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.alertTypeSelector}>
                    {[
                      { value: 'missed_dose', label: 'Missed Dose' },
                      { value: 'low_inventory', label: 'Low Inventory' },
                      { value: 'symptom_severity', label: 'High Symptom Severity' }
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.alertTypeItem,
                          alertType === type.value && styles.alertTypeItemSelected
                        ]}
                        onPress={() => setAlertType(type.value as any)}
                      >
                        <Text
                          style={[
                            styles.alertTypeItemText,
                            alertType === type.value && styles.alertTypeItemTextSelected
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Condition {alertType === 'missed_dose' ? '(Hours)' :
                           alertType === 'low_inventory' ? '(Days)' : '(Severity 1-5)'} *
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={
                    alertType === 'missed_dose' ? '2' :
                    alertType === 'low_inventory' ? '7' : '4'
                  }
                  value={alertCondition}
                  onChangeText={setAlertCondition}
                  keyboardType="numeric"
                  placeholderTextColor={safeTheme.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddAlert(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleCreateAlertRule}>
                <Text style={styles.submitButtonText}>Create Rule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors, fontSize: number, bodyFontSize: number, smallFontSize: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: Spacing.xl,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: fontSize + 2,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: bodyFontSize,
      color: colors.primary,
      fontWeight: '500' as const,
    },
    tabButtonTextActive: {
      color: colors.surface,
      fontWeight: '600' as const,
    },
    scrollView: {
      flex: 1,
    },
    tabContent: {
      padding: Spacing.xl,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    addButtonText: {
      color: colors.surface,
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
    },
    caregiverList: {
      gap: Spacing.lg,
    },
    caregiverCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    caregiverInfo: {
      flex: 1,
    },
    caregiverHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    caregiverName: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
    },
    authorizationBadge: {
      width: 24,
      height: 24,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    caregiverEmail: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    caregiverRelationship: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    permissionsContainer: {
      marginBottom: Spacing.md,
    },
    permissionsLabel: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    permissionsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    permissionBadge: {
      backgroundColor: colors.backgroundDark,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    permissionText: {
      fontSize: smallFontSize - 2,
      color: colors.textSecondary,
    },
    caregiverActions: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.backgroundDark,
    },
    actionButtonText: {
      fontSize: smallFontSize - 2,
      color: colors.textSecondary,
    },
    alertRulesList: {
      gap: Spacing.lg,
    },
    alertRuleCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    alertRuleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    alertRuleInfo: {
      flex: 1,
    },
    alertRuleType: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
    },
    alertRuleCaregiver: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
    },
    alertRuleStatus: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    alertRuleStatusText: {
      fontSize: smallFontSize - 2,
      color: colors.surface,
      fontWeight: '500' as const,
    },
    alertRuleCondition: {
      backgroundColor: colors.backgroundDark,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
    },
    alertRuleConditionText: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
      gap: Spacing.lg,
    },
    emptyStateText: {
      fontSize: bodyFontSize,
      color: colors.text,
      fontWeight: '600' as const,
    },
    emptyStateSubtext: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: bodyFontSize + 2,
      fontWeight: '600' as const,
      color: colors.text,
    },
    modalForm: {
      padding: Spacing.xl,
      maxHeight: 400,
    },
    formGroup: {
      marginBottom: Spacing.lg,
    },
    formLabel: {
      fontSize: smallFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    formInput: {
      backgroundColor: colors.backgroundDark,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: bodyFontSize,
      color: colors.text,
    },
    permissionsSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    permissionSelector: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.backgroundDark,
    },
    permissionSelectorSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    permissionSelectorText: {
      fontSize: smallFontSize - 2,
      color: colors.textSecondary,
    },
    permissionSelectorTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    caregiverSelector: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    caregiverSelectorItem: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.backgroundDark,
    },
    caregiverSelectorItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    caregiverSelectorItemText: {
      fontSize: smallFontSize - 2,
      color: colors.textSecondary,
    },
    caregiverSelectorItemTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    alertTypeSelector: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    alertTypeItem: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.backgroundDark,
    },
    alertTypeItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    alertTypeItemText: {
      fontSize: smallFontSize - 2,
      color: colors.textSecondary,
    },
    alertTypeItemTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    modalActions: {
      flexDirection: 'row',
      padding: Spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: Spacing.lg,
    },
    cancelButton: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
    },
    submitButton: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: bodyFontSize,
      color: colors.surface,
      fontWeight: '600' as const,
    },
  });