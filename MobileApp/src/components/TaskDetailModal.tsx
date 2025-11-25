import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { Task, TaskPriority, TaskUser } from '../types/Task';
import { taskService } from '../services/taskService';

interface TaskDetailModalProps {
  visible: boolean;
  task: any | null; // Supports both Task and TaskSummary shapes
  onClose: () => void;
  onUpdateTask?: (task: any) => void; // Local update only (no backend yet)
  onDeleteTask?: (taskId: number | string) => void;
  showProjectChip?: boolean; // show project name chip in header
  onNavigateToProject?: (projectId: string) => void; // Navigate to project detail
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Simple inline date picker modal
const SimpleDatePickerModal = ({
  visible,
  initialDate,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState<Date>(initialDate);
  const [month, setMonth] = useState<number>(initialDate.getMonth());
  const [year, setYear] = useState<number>(initialDate.getFullYear());

  useEffect(() => {
    setSelected(initialDate);
    setMonth(initialDate.getMonth());
    setYear(initialDate.getFullYear());
  }, [initialDate]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handleMonthChange = (dir: 'prev' | 'next') => {
    let m = month;
    let y = year;
    if (dir === 'prev') {
      m -= 1; if (m < 0) { m = 11; y -= 1; }
    } else {
      m += 1; if (m > 11) { m = 0; y += 1; }
    }
    setMonth(m); setYear(y);
  };

  const renderCalendar = () => {
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) nodes.push(<View key={`empty-${i}`} style={styles.calDay} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selected.getDate() === d && selected.getMonth() === month && selected.getFullYear() === year;
      nodes.push(
        <TouchableOpacity key={`d-${d}`} style={[styles.calDay, isSelected && styles.calDaySelected]} onPress={() => setSelected(new Date(year, month, d))}>
          <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>{d}</Text>
        </TouchableOpacity>
      );
    }
    return nodes;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dpOverlay}>
        <View style={styles.dpContainer}>
          <View style={styles.dpHeader}>
            <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.navBtn}>
              <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.dpTitle}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.navBtn}>
              <MaterialIcons name="chevron-right" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.dpWeekRow}>{daysOfWeek.map(d => <Text key={d} style={styles.dpWeekText}>{d}</Text>)}</View>
          <View style={styles.dpGrid}>{renderCalendar()}</View>
          <View style={styles.dpFooter}>
            <TouchableOpacity style={styles.dpBtn} onPress={onClose}><Text style={styles.dpBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dpBtn, styles.dpConfirm]} onPress={() => onConfirm(selected)}>
              <Text style={[styles.dpBtnText, styles.dpConfirmText]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const DROPDOWN_MAX_HEIGHT = Math.min(Dimensions.get('window').height * 0.33, 240);

const priorityOptions = [
  { value: TaskPriority.URGENT, label: 'Urgent', color: Colors.error },
  { value: TaskPriority.HIGHEST, label: 'High', color: Colors.warning },
  { value: TaskPriority.MEDIUM, label: 'Medium', color: Colors.primary },
  { value: TaskPriority.LOW, label: 'Low', color: Colors.accent },
  { value: TaskPriority.LOWEST, label: 'Lowest', color: Colors.neutral.medium },
];

const statusOptions = [
  { value: 'To Do', label: 'To Do', icon: 'radio-button-unchecked', color: Colors.neutral.medium },
  { value: 'In Progress', label: 'In Progress', icon: 'pending', color: Colors.primary },
  { value: 'Review', label: 'Review', icon: 'rate-review', color: Colors.warning },
  { value: 'Done', label: 'Done', icon: 'check-circle', color: Colors.success },
];

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  visible, 
  task, 
  onClose, 
  onUpdateTask, 
  showProjectChip = false,
  onNavigateToProject,
}) => {
  // Always editable UI
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<TaskUser[]>([]);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('To Do');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const [showAssigneeDD, setShowAssigneeDD] = useState(false);
  const [showPriorityDD, setShowPriorityDD] = useState(false);
  const [showStatusDD, setShowStatusDD] = useState(false);
  const [showStartDP, setShowStartDP] = useState(false);
  const [showDueDP, setShowDueDP] = useState(false);

  // Snapshot to detect changes
  const [base, setBase] = useState<{ name: string; description: string; assigneeId?: number; priority?: number | null; status?: string; start?: string | null; due?: string | null } | null>(null);

  const populateFromTask = (t: any) => {
    const nameVal = t.taskName ?? t.title ?? '';
    const descVal = t.description ?? '';
    const assigned = t.assignedTo ?? (t.assignee?.id ? Number(t.assignee.id) : (t.assigneeId ? Number(t.assigneeId) : undefined));

    let priorityVal: number | null = null;
    if (typeof t.priority === 'number') {
      priorityVal = t.priority;
    } else if (typeof t.priority === 'string') {
      const map: Record<string, number> = { urgent: 5, high: 4, medium: 3, low: 2 };
      priorityVal = map[String(t.priority).toLowerCase()] ?? null;
    }

    let statusVal = 'To Do';
    if (t.status) {
      const s = String(t.status).toLowerCase();
      if (s.includes('progress')) statusVal = 'In Progress';
      else if (s.includes('review')) statusVal = 'Review';
      else if (s.includes('done') || s.includes('complete')) statusVal = 'Done';
      else if (s.includes('to do') || s.includes('todo')) statusVal = 'To Do';
    }

    const start = t.startTime ? new Date(t.startTime as any) : (t.startDate ? new Date(t.startDate as any) : null);
    const due = t.endTime ? new Date(t.endTime as any) : (t.dueDate ? new Date(t.dueDate as any) : null);

    setName(nameVal);
    setDescription(descVal);
    setAssigneeId(assigned);
    setPriority(priorityVal);
    setStatus(statusVal);
    setStartDate(start);
    setDueDate(due);

    setBase({
      name: nameVal,
      description: descVal,
      assigneeId: assigned,
      priority: priorityVal,
      status: statusVal,
      start: start ? start.toISOString() : null,
      due: due ? due.toISOString() : null,
    });
  };

  useEffect(() => {
    if (!task) return;
    populateFromTask(task);
  }, [task]);

  // Also hydrate from backend whenever modal opens to ensure latest status
  useEffect(() => {
    const hydrate = async () => {
      try {
        if (visible && task?.id) {
          const latest = await taskService.getTaskById(Number(task.id));
          if (latest) populateFromTask(latest);
        }
      } catch {}
    };
    hydrate();
  }, [visible]);

  // Fetch possible assignees when modal opens and has projectId
  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        if (visible && task?.projectId) {
          const arr = await taskService.getAvailableAssignees(Number(task.projectId));
          setAssignees(arr || []);
        } else {
          setAssignees([]);
        }
      } catch (e) {
        setAssignees([]);
      }
    };
    fetchAssignees();
  }, [visible, task?.projectId]);

  const selectedAssigneeName = useMemo(() => {
    if (!assigneeId) return 'Select assignee';
    const u = assignees.find(a => a.id === assigneeId);
    return u?.username || `User ${assigneeId}`;
  }, [assigneeId, assignees]);

  const selectedPriorityLabel = useMemo(() => {
    if (!priority) return 'Select priority';
    return priorityOptions.find(p => p.value === priority)?.label || 'Select priority';
  }, [priority]);

  const selectedStatusLabel = useMemo(() => {
    return statusOptions.find(s => s.value === status)?.label || 'To Do';
  }, [status]);

  const isDirty = useMemo(() => {
    if (!base) return false;
    const startIso = startDate ? startDate.toISOString() : null;
    const dueIso = dueDate ? dueDate.toISOString() : null;
    return (
      base.name !== name.trim() ||
      base.description !== description.trim() ||
      (base.assigneeId ?? undefined) !== (assigneeId ?? undefined) ||
      (base.priority ?? null) !== (priority ?? null) ||
      (base.status ?? 'To Do') !== status ||
      base.start !== startIso ||
      base.due !== dueIso
    );
  }, [base, name, description, assigneeId, priority, status, startDate, dueDate]);

  const handleSave = async () => {
    if (!task || !isDirty) return;
    
    try {
      // Prepare update payload
      const updates: any = {
        taskName: name.trim(),
        description: description.trim(),
        assignedTo: assigneeId,
        priority: priority || task.priority,
        status: status,
        startTime: startDate ? startDate.toISOString() : null,
        endTime: dueDate ? dueDate.toISOString() : null,
      };

      // Call API to update task
      const taskId = Number(task.id || task.taskId);
      await taskService.updateTask(taskId, updates);

      // Prepare updated task object for local state
    const updated: Task = {
      ...task,
      taskName: name.trim(),
      description: description.trim(),
      assignedTo: assigneeId,
      assignee: assigneeId ? (assignees.find(a => a.id === assigneeId) || undefined) : null,
      priority: priority || task.priority,
      status: status,
      startTime: startDate ? startDate.toISOString() : null,
      endTime: dueDate ? dueDate.toISOString() : null,
    } as Task;
      
      // Notify parent component to refresh
    onUpdateTask && onUpdateTask(updated);
    onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      // You might want to show an error toast here
    }
  };

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.headerIconBtn}>
              <MaterialIcons name="close" size={20} color={Colors.neutral.dark} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Task Details</Text>
            {showProjectChip && (task?.project?.projectName || task?.projectName) && onNavigateToProject ? (
              <TouchableOpacity 
                onPress={() => onNavigateToProject(task?.projectId || task?.project?.id)}
                style={styles.headerGoProjectBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.headerGoProjectText}>Go to project</Text>
                <MaterialIcons name="chevron-right" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={{width: 40}} />
            )}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Task Name */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Task Name</Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="Enter task name"
                style={[styles.input, styles.inputLg]}
                outlineStyle={styles.inputOutline}
                theme={{ colors: { primary: Colors.primary, outline: Colors.neutral.medium, onSurface: Colors.text } }}
                left={<TextInput.Icon icon={() => <MaterialIcons name="assignment" size={18} color={Colors.neutral.medium} />} />}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textarea]}
                outlineStyle={styles.inputOutline}
                theme={{ colors: { primary: Colors.primary, outline: Colors.neutral.light, onSurface: Colors.text } }}
                left={<TextInput.Icon icon={() => <MaterialIcons name="notes" size={18} color={Colors.neutral.medium} />} />}
              />
            </View>

            {/* Status */}
            <View style={[styles.fieldBlock, { zIndex: showStatusDD ? 200 : 1 }]}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.dropdownWrap}>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => { 
                    setShowStatusDD(s => !s); 
                    if (!showStatusDD) { 
                      setShowAssigneeDD(false); 
                      setShowPriorityDD(false); 
                    } 
                  }}
                >
                  <View style={styles.dropdownContent}>
                    <MaterialIcons 
                      name={statusOptions.find(s => s.value === status)?.icon || 'radio-button-unchecked'} 
                      size={18} 
                      color={statusOptions.find(s => s.value === status)?.color || Colors.neutral.medium} 
                    />
                    <Text style={styles.dropdownText}>{selectedStatusLabel}</Text>
                  </View>
                  <View style={styles.dropdownIconWrap}>
                    <MaterialIcons 
                      name={showStatusDD ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                      size={20} 
                      color={Colors.neutral.medium} 
                    />
                  </View>
                </TouchableOpacity>
                {showStatusDD && (
                  <View style={[styles.dropdownMenu, { maxHeight: DROPDOWN_MAX_HEIGHT }]}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {statusOptions.map(s => (
                        <TouchableOpacity 
                          key={s.value} 
                          style={styles.dropdownOption} 
                          onPress={() => { 
                            setStatus(s.value); 
                            setShowStatusDD(false); 
                          }}
                        >
                          <View style={[styles.priorityIndicator, { backgroundColor: s.color + '20' }]}> 
                            <MaterialIcons name={s.icon} size={18} color={s.color} />
                          </View>
                          <Text style={styles.optionTitle}>{s.label}</Text>
                          {status === s.value && <MaterialIcons name="check" size={20} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Assignee + Priority */}
            <View style={styles.row}>
              <View style={[styles.col, { zIndex: showAssigneeDD ? 200 : 1 }]}> 
                <Text style={styles.label}>Assignee</Text>
                <View style={styles.dropdownWrap}>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => { setShowAssigneeDD(s => !s); if (!showAssigneeDD) setShowPriorityDD(false); }}
                  >
                    <View style={styles.dropdownContent}>
                      <MaterialIcons name="person" size={18} color={Colors.neutral.medium} />
                      <Text style={styles.dropdownText}>{selectedAssigneeName}</Text>
                    </View>
                    <View style={styles.dropdownIconWrap}><MaterialIcons name={showAssigneeDD ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={Colors.neutral.medium} /></View>
                  </TouchableOpacity>
                  {showAssigneeDD && (
                    <View style={[styles.dropdownMenu, { maxHeight: DROPDOWN_MAX_HEIGHT }]}>
                      <ScrollView style={{ maxHeight: 220 }}>
                        {assignees.map(u => (
                          <TouchableOpacity key={u.id} style={styles.dropdownOption} onPress={() => { setAssigneeId(u.id); setShowAssigneeDD(false); }}>
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>{(u.username || 'U').charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.optionTitle}>{u.username}</Text>
                              <Text style={styles.optionSub}>{u.email}</Text>
                            </View>
                            {assigneeId === u.id && <MaterialIcons name="check" size={20} color={Colors.primary} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.col, { zIndex: showPriorityDD ? 200 : 1 }]}> 
                <Text style={styles.label}>Priority</Text>
                <View style={styles.dropdownWrap}>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => { setShowPriorityDD(s => !s); if (!showPriorityDD) setShowAssigneeDD(false); }}
                  >
                    <View style={styles.dropdownContent}>
                      <MaterialIcons name="flag" size={18} color={Colors.neutral.medium} />
                      <Text style={styles.dropdownText}>{selectedPriorityLabel}</Text>
                    </View>
                    <View style={styles.dropdownIconWrap}><MaterialIcons name={showPriorityDD ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={Colors.neutral.medium} /></View>
                  </TouchableOpacity>
                  {showPriorityDD && (
                    <View style={[styles.dropdownMenu, { maxHeight: DROPDOWN_MAX_HEIGHT }]}>
                      <ScrollView style={{ maxHeight: 220 }}>
                        {priorityOptions.map(p => (
                          <TouchableOpacity key={p.value} style={styles.dropdownOption} onPress={() => { setPriority(p.value); setShowPriorityDD(false); }}>
                            <View style={[styles.priorityIndicator, { backgroundColor: p.color + '20' }]}> 
                              <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                            </View>
                            <Text style={styles.optionTitle}>{p.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Dates */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDP(true)}>
                  <View style={styles.dropdownContent}>
                    <MaterialIcons name="calendar-today" size={18} color={Colors.neutral.medium} />
                    <Text style={styles.dropdownText}>{startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'Select start date'}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDueDP(true)}>
                  <View style={styles.dropdownContent}>
                    <MaterialIcons name="event" size={18} color={Colors.neutral.medium} />
                    <Text style={styles.dropdownText}>{dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'Select due date'}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]} onPress={handleSave} disabled={!isDirty}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Date pickers */}
        {showStartDP && (
          <SimpleDatePickerModal
            visible={showStartDP}
            initialDate={startDate || new Date()}
            onConfirm={(d) => { setStartDate(d); setShowStartDP(false); }}
            onClose={() => setShowStartDP(false)}
          />
        )}
        {showDueDP && (
          <SimpleDatePickerModal
            visible={showDueDP}
            initialDate={dueDate || new Date()}
            onConfirm={(d) => { setDueDate(d); setShowDueDP(false); }}
            onClose={() => setShowDueDP(false)}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 16, maxHeight: Dimensions.get('window').height * 0.9 },
  handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: Colors.neutral.light, marginTop: 8, marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  headerIconBtn: { padding: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.dark },
  headerTextBtn: { padding: 8 },
  headerTextBtnLabel: { color: Colors.neutral.medium, fontWeight: '700' },
  headerProjectText: { maxWidth: 180, fontSize: 12, color: Colors.neutral.medium, fontWeight: '700', textAlign: 'right' },
  headerProjectBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  headerGoProjectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.neutral.light + '30', borderRadius: 16 },
  headerGoProjectText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  body: { paddingHorizontal: 16, paddingBottom: 12 },

  fieldBlock: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  input: { backgroundColor: Colors.neutral.white, fontSize: 16 },
  inputLg: { height: 48 },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  inputOutline: { borderRadius: 12, borderWidth: 1 },

  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  dropdownWrap: { position: 'relative' },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.neutral.light, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.neutral.white,
    minHeight: 48
  },
  dropdownContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownText: { color: Colors.text, fontSize: 16, flex: 1 },
  dropdownIconWrap: { marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  dropdownMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.neutral.light, borderRadius: 12,
    marginTop: 6, elevation: 14, zIndex: 300, maxHeight: 240,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6,
  },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '50' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.surface, fontWeight: '700' },
  optionTitle: { fontSize: 15, color: Colors.neutral.dark, fontWeight: '500' },
  optionSub: { fontSize: 12, color: Colors.neutral.medium },

  priorityIndicator: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },

  dateBtn: { borderWidth: 1, borderColor: Colors.neutral.medium, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.neutral.white, minHeight: 48 },

  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtnDisabled: { backgroundColor: Colors.neutral.medium },
  saveBtnText: { color: Colors.neutral.white, fontWeight: '700' },

  // Date picker styles
  dpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  dpContainer: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, width: '90%', maxWidth: 360 },
  dpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: { padding: 8 },
  dpTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  dpWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 6 },
  dpWeekText: { width: 32, textAlign: 'center', color: Colors.neutral.medium, fontWeight: '500' },
  dpGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  calDay: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  calDaySelected: { backgroundColor: Colors.primary },
  calDayText: { color: Colors.text },
  calDayTextSelected: { color: Colors.surface, fontWeight: '700' },
  dpFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  dpBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  dpConfirm: { backgroundColor: Colors.primary, borderRadius: 8, marginLeft: 8 },
  dpBtnText: { color: Colors.primary, fontWeight: '700' },
  dpConfirmText: { color: Colors.surface },
});

export default TaskDetailModal;
