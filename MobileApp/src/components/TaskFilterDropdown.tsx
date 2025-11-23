import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

export type PriorityFilter = 'All' | 'Low' | 'Medium' | 'High' | 'Urgent';
export type DueDateFilter = 'All' | 'Overdue' | 'Today' | 'Tomorrow' | 'ThisWeek' | 'NextWeek' | 'NoDue';

export interface TaskFilterState {
  priority: PriorityFilter;
  dueDate: DueDateFilter;
  assigneeId?: string | null;
}

interface AssigneeOption { id: string; name: string }

interface TaskFilterDropdownProps {
  visible: boolean;
  onClose: () => void;
  value: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  assignees?: AssigneeOption[];
}

const priorities: PriorityFilter[] = ['All', 'Low', 'Medium', 'High', 'Urgent'];
const dueDateOptions: { key: DueDateFilter; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Today', label: 'Today' },
  { key: 'Tomorrow', label: 'Tomorrow' },
  { key: 'ThisWeek', label: 'This week' },
  { key: 'NextWeek', label: 'Next week' },
  { key: 'NoDue', label: 'No due date' },
];

const TaskFilterDropdown: React.FC<TaskFilterDropdownProps> = ({ visible, onClose, value, onChange, assignees = [] }) => {
  const [draft, setDraft] = useState<TaskFilterState>(value);
  const selectedAssignee = useMemo(() => assignees.find(a => a.id === draft.assigneeId)?.name ?? 'All', [assignees, draft.assigneeId]);

  // Sync draft from value when opening or when value changes externally
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const setPriority = (p: PriorityFilter) => setDraft(prev => ({ ...prev, priority: p }));
  const setDue = (d: DueDateFilter) => setDraft(prev => ({ ...prev, dueDate: d }));
  const setAssignee = (id?: string | null) => setDraft(prev => ({ ...prev, assigneeId: id ?? null }));
  const clearDraft = () => setDraft({ priority: 'All', dueDate: 'All', assigneeId: null });
  const applyDraft = () => {
    onChange(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={20} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.section} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.rowWrap}>
              {priorities.map(p => (
                <TouchableOpacity key={p} style={[styles.chip, draft.priority === p && styles.chipActive]} onPress={() => setPriority(p)}>
                  <Text style={[styles.chipText, draft.priority === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.separator} />

          <ScrollView style={styles.section} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.sectionTitle}>Due date</Text>
            <View style={styles.rowWrap}>
              {dueDateOptions.map(opt => (
                <TouchableOpacity key={opt.key} style={[styles.chip, draft.dueDate === opt.key && styles.chipActive]} onPress={() => setDue(opt.key)}>
                  <Text style={[styles.chipText, draft.dueDate === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.separator} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignee</Text>
            <View style={styles.rowWrap}>
              <TouchableOpacity style={[styles.chip, (draft.assigneeId == null) && styles.chipActive]} onPress={() => setAssignee(null)}>
                <Text style={[styles.chipText, (draft.assigneeId == null) && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {assignees.map(a => (
                <TouchableOpacity key={a.id} style={[styles.chip, draft.assigneeId === a.id && styles.chipActive]} onPress={() => setAssignee(a.id)}>
                  <Text style={[styles.chipText, draft.assigneeId === a.id && styles.chipTextActive]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearDraft}>
              <MaterialIcons name="filter-alt-off" size={18} color={Colors.neutral.dark} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyDraft}>
              <MaterialIcons name="check" size={18} color={Colors.surface} />
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    color: Colors.neutral.dark,
    fontWeight: '700',
  },
  section: {
    paddingVertical: 8,
  },
  sectionTitle: {
    color: Colors.neutral.dark,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.neutral.dark,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral.light,
    marginVertical: 8,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    paddingTop: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clearText: {
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  applyText: {
    color: Colors.surface,
    fontWeight: '600',
  },
});

export default TaskFilterDropdown;


