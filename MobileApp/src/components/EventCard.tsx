import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

export interface Event {
  id: number;
  eventName: string;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  projectId: number;
  projectName?: string;
  creatorId: number;
  creatorName?: string;
}

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onEdit?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress, onEdit }) => {
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="event" size={20} color={Colors.primary} />
          <Text style={styles.eventName} numberOfLines={2}>
            {event.eventName}
          </Text>
        </View>

        {event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {event.projectName && (
          <View style={styles.projectRow}>
            <MaterialIcons
              name="folder"
              size={14}
              color={Colors.neutral.medium}
            />
            <Text style={styles.projectName}>{event.projectName}</Text>
          </View>
        )}

        <View style={styles.timeRow}>
          <MaterialIcons
            name="schedule"
            size={14}
            color={Colors.neutral.medium}
          />
          <Text style={styles.timeText}>{formatDateTime(event.startTime)}</Text>
          <MaterialIcons
            name="arrow-forward"
            size={12}
            color={Colors.neutral.medium}
          />
          <Text style={styles.timeText}>{formatTime(event.endTime)}</Text>
        </View>
      </View>

      {onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={e => {
            e.stopPropagation();
            onEdit();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="edit" size={18} color={Colors.neutral.medium} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginBottom: 8,
    lineHeight: 20,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  projectName: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  editButton: {
    padding: 8,
  },
});

export default EventCard;
