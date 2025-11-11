// app/calendar-view.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Circle } from 'lucide-react-native';
import { useApp } from '../contexts/AppContext';
import { getCalendarAdherence } from './services/api';
import { Spacing, BorderRadius, FontSizes } from '../constants/colors';
import type { ThemeColors } from '../constants/colors';

interface CalendarDayData {
  date: string;
  day: number;
  status: 'green' | 'yellow' | 'red' | 'gray';
  total_doses: number;
  taken_doses: number;
  missed_doses: number;
  adherence_rate: number;
}

interface Props {
  theme: ThemeColors;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarViewScreen() {
  const { appData, theme } = useApp();
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<CalendarDayData | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const fetchCalendarData = async (date: Date) => {
    setIsLoading(true);
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const response = await getCalendarAdherence(month, year);
      
      if (response.calendar) {
        setCalendarData(response.calendar);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentDate);
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (CalendarDayData | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateStr);
      days.push(dayData || {
        date: dateStr,
        day,
        status: 'gray' as const,
        total_doses: 0,
        taken_doses: 0,
        missed_doses: 0,
        adherence_rate: 100
      });
    }
    
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return safeTheme.success;
      case 'yellow': return safeTheme.warning;
      case 'red': return safeTheme.error;
      case 'gray': return safeTheme.disabled;
      default: return safeTheme.disabled;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return CheckCircle;
      case 'yellow': return Circle;
      case 'red': return XCircle;
      case 'gray': return Circle;
      default: return Circle;
    }
  };

  const fontSize = appData.user.largeText ? FontSizes.xxxl : FontSizes.xl;
  const bodyFontSize = appData.user.largeText ? FontSizes.xl : FontSizes.lg;
  const smallFontSize = appData.user.largeText ? FontSizes.lg : FontSizes.md;
  const tinyFontSize = appData.user.largeText ? FontSizes.md : FontSizes.sm;
  const styles = createStyles(safeTheme, fontSize, bodyFontSize, smallFontSize, tinyFontSize);

  const days = getDaysInMonth(currentDate);
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adherence Calendar</Text>
        <Text style={styles.subtitle}>
          Monthly view of your medication adherence
        </Text>
      </View>

      {/* Month Navigator */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <ChevronLeft size={24} color={safeTheme.text} />
        </TouchableOpacity>
        
        <View style={styles.monthLabel}>
          <Text style={styles.monthText}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <ChevronRight size={24} color={safeTheme.text} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        {/* Weekday Headers */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.calendarGrid}>
          {days.map((dayData, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                dayData && dayData.date === today && styles.todayCell,
                dayData && selectedDate?.date === dayData.date && styles.selectedCell
              ]}
              onPress={() => dayData && setSelectedDate(dayData)}
              disabled={!dayData}
            >
              {dayData ? (
                <View style={styles.dayContent}>
                  <Text style={[
                    styles.dayNumber,
                    dayData.date === today && styles.todayText,
                    selectedDate?.date === dayData.date && styles.selectedText
                  ]}>
                    {dayData.day}
                  </Text>
                  
                  {dayData.total_doses > 0 && (
                    <View style={styles.statusContainer}>
                      {React.createElement(getStatusIcon(dayData.status), {
                        size: 12,
                        color: getStatusColor(dayData.status)
                      })}
                    </View>
                  )}
                  
                  {dayData.total_doses > 0 && (
                    <Text style={[
                      styles.adherenceText,
                      { color: getStatusColor(dayData.status) }
                    ]}>
                      {dayData.adherence_rate}%
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.emptyDay} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <CheckCircle size={16} color={safeTheme.success} />
            <Text style={styles.legendText}>Perfect (100%)</Text>
          </View>
          <View style={styles.legendItem}>
            <Circle size={16} color={safeTheme.warning} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <XCircle size={16} color={safeTheme.error} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
          <View style={styles.legendItem}>
            <Circle size={16} color={safeTheme.disabled} />
            <Text style={styles.legendText}>No doses</Text>
          </View>
        </View>
      </View>

      {/* Selected Day Details Modal/Panel */}
      {selectedDate && (
        <View style={styles.detailsPanel}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>
              {new Date(selectedDate.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <XCircle size={20} color={safeTheme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {selectedDate.total_doses > 0 ? (
            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Doses:</Text>
                <Text style={styles.detailValue}>{selectedDate.total_doses}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Taken:</Text>
                <Text style={[styles.detailValue, { color: safeTheme.success }]}>
                  {selectedDate.taken_doses}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Missed:</Text>
                <Text style={[styles.detailValue, { color: safeTheme.error }]}>
                  {selectedDate.missed_doses}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Adherence Rate:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: getStatusColor(selectedDate.status) }
                ]}>
                  {selectedDate.adherence_rate}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDosesText}>No medications scheduled for this day</Text>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, fontSize: number, bodyFontSize: number, smallFontSize: number, tinyFontSize: number) =>
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
    monthNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.xl,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthLabel: {
      flex: 1,
      alignItems: 'center',
    },
    monthText: {
      fontSize: bodyFontSize + 2,
      fontWeight: '600' as const,
      color: colors.text,
    },
    calendarContainer: {
      flex: 1,
    },
    weekdayHeader: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    weekdayCell: {
      flex: 1,
      padding: Spacing.sm,
      alignItems: 'center',
    },
    weekdayText: {
      fontSize: smallFontSize,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.surface,
    },
    dayCell: {
      width: '14.28%', // 100/7
      aspectRatio: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayCell: {
      backgroundColor: colors.primary + '20',
    },
    selectedCell: {
      backgroundColor: colors.primary + '40',
    },
    dayContent: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      padding: 2,
    },
    dayNumber: {
      fontSize: smallFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    todayText: {
      color: colors.primary,
      fontWeight: '700' as const,
    },
    selectedText: {
      color: colors.primary,
      fontWeight: '700' as const,
    },
    statusContainer: {
      marginBottom: 2,
    },
    adherenceText: {
      fontSize: tinyFontSize,
      fontWeight: '600' as const,
    },
    emptyDay: {
      width: '100%',
      height: '100%',
    },
    legend: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendTitle: {
      fontSize: smallFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    legendItems: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    legendText: {
      fontSize: tinyFontSize,
      color: colors.textSecondary,
    },
    detailsPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: Spacing.xl,
      maxHeight: '40%',
    },
    detailsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    detailsTitle: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      flex: 1,
    },
    detailsContent: {
      gap: Spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      flex: 1,
    },
    detailValue: {
      fontSize: smallFontSize,
      fontWeight: '600' as const,
      color: colors.text,
    },
    noDosesText: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });