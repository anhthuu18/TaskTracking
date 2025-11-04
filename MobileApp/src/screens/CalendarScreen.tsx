import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { Event } from '../types/Event';

interface CalendarScreenProps {
  navigation?: any;
  route?: any;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  // Mock events data - replace with actual API call
  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await eventService.getEvents({ startDate: selectedDate });
      // setEvents(response.data);
      
      // Mock events data for UI preview
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Team Meeting',
          description: 'Weekly team sync meeting',
          startDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
          endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
          startTime: '10:00',
          endTime: '11:00',
          includeTime: true,
          location: 'Conference Room A',
          assignedMembers: ['1', '2'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Project Review',
          description: 'Review project progress and milestones',
          startDate: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 14, 30),
          endDate: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 16, 0),
          startTime: '14:30',
          endTime: '16:00',
          includeTime: true,
          location: 'Virtual Meeting',
          assignedMembers: ['1', '2', '3'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          title: 'Sprint Planning',
          description: 'Plan tasks for next sprint',
          startDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0),
          endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 12, 0),
          startTime: '09:00',
          endTime: '12:00',
          includeTime: true,
          location: 'Office',
          assignedMembers: ['1', '2', '3', '4'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          title: 'Client Presentation',
          description: 'Present project status to client',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30),
          startTime: '15:00',
          endTime: '16:30',
          includeTime: true,
          location: 'Client Office',
          assignedMembers: ['1', '2'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '5',
          title: 'Workshop: Design System',
          description: 'Learn about design system implementation',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0),
          startTime: '13:00',
          endTime: '17:00',
          includeTime: true,
          location: 'Training Room',
          assignedMembers: ['2', '3', '4', '5'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleCreateEvent = () => {
    if (navigation) {
      navigation.navigate('CreateEvent', {
        projectMembers: [],
        projectId: undefined,
      });
    } else {
      setShowCreateEventModal(true);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const getWeekdayName = (day: number) => {
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return weekdays[day];
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth && 
                        selectedDate.getFullYear() === currentYear;
      const today = new Date();
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentMonth && 
                     today.getFullYear() === currentYear;
      
      // Check if there are events on this day
      const hasEvents = events.some(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.getDate() === day &&
               eventDate.getMonth() === currentMonth &&
               eventDate.getFullYear() === currentYear;
      });
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected
          ]}
          onPress={() => {
            const newDate = new Date(currentYear, currentMonth, day);
            setSelectedDate(newDate);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && styles.calendarDayTextToday
          ]}>
            {day}
          </Text>
          {hasEvents && (
            <View style={[
              styles.eventDot,
              isSelected && styles.eventDotSelected
            ]} />
          )}
        </TouchableOpacity>
      );
    }
    
    // Add empty cells to fill the remaining space (always 42 cells total)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <View key={`empty-end-${i}`} style={styles.calendarDay} />
      );
    }
    
    return days;
  };

  const getEventsForSelectedDate = () => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === selectedDate.getDate() &&
             eventDate.getMonth() === selectedDate.getMonth() &&
             eventDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const formatEventTime = (event: Event) => {
    if (event.includeTime && event.startTime) {
      return event.startTime;
    }
    return '';
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.eventItem}>
      <View style={styles.eventLeft}>
        <View style={styles.eventTimeContainer}>
          {item.includeTime && item.startTime && (
            <Text style={styles.eventTime}>{item.startTime}</Text>
          )}
        </View>
        <View style={styles.eventDivider} />
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.eventFooter}>
          {item.location && (
            <View style={styles.eventMeta}>
              <MaterialIcons name="location-on" size={14} color={Colors.neutral.medium} />
              <Text style={styles.eventMetaText}>{item.location}</Text>
            </View>
          )}
          {item.assignedMembers.length > 0 && (
            <View style={styles.eventMeta}>
              <MaterialIcons name="people" size={14} color={Colors.neutral.medium} />
              <Text style={styles.eventMetaText}>
                {item.assignedMembers.length} member{item.assignedMembers.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const selectedDateEvents = getEventsForSelectedDate();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header with Create Event Button */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your schedule and events
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.createButtonSmall}
            onPress={handleCreateEvent}
          >
            <MaterialIcons name="add" size={16} color={Colors.neutral.white} />
            <Text style={styles.createButtonSmallText}>Create Event</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.surface }]}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              onPress={() => navigateMonth('prev')}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-left" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.calendarTitleContainer}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {getMonthName(currentMonth)}
              </Text>
              <Text style={[styles.calendarYear, { color: colors.textSecondary }]}>
                {currentYear}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigateMonth('next')}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-right" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Weekday Headers */}
            <View style={styles.calendarHeaderRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <Text key={day} style={[styles.weekdayHeader, { color: colors.textSecondary }]}>
                  {getWeekdayName(day)}
                </Text>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.calendarDays}>
              {renderCalendarDays()}
            </View>
          </View>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateSection}>
          <Text style={[styles.selectedDateText, { color: colors.text }]}>
            {formatEventDate(selectedDate)}
          </Text>
          {selectedDateEvents.length > 0 && (
            <Text style={[styles.eventCountText, { color: colors.textSecondary }]}>
              {selectedDateEvents.length} event{selectedDateEvents.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Events List - Filtered by selected date */}
        <View style={styles.eventsSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : selectedDateEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color={Colors.neutral.medium} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No events</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No events scheduled for this date
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.eventsScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {selectedDateEvents.map((event) => (
                <View key={event.id}>
                  {renderEventItem({ item: event })}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingBottom: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  createButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    marginTop: 4,
  },
  createButtonSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: Colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '60',
  },
  navButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.neutral.light + '30',
  },
  calendarTitleContainer: {
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  calendarYear: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    marginTop: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  weekdayHeader: {
    fontSize: 10,
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
    color: Colors.neutral.medium,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: 16,
    position: 'relative',
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDayToday: {
    backgroundColor: Colors.neutral.light,
  },
  calendarDayText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  eventDotSelected: {
    backgroundColor: Colors.neutral.white,
  },
  selectedDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventCountText: {
    fontSize: 13,
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventsScrollView: {
    maxHeight: 400,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  eventLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  eventTimeContainer: {
    minWidth: 50,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventDivider: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.primary,
    marginVertical: 8,
    borderRadius: 1,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
});

export default CalendarScreen;
