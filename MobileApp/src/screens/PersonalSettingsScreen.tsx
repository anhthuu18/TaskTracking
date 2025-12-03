import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, StatusBar } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { useToastContext } from '../context/ToastContext';
import { localNotification } from '../services/localNotification';

const PersonalSettingsScreen: React.FC<any> = () => {
  const { showSuccess, showError } = useToastContext();

  const [focus, setFocus] = useState('25');
  const [shortBreak, setShortBreak] = useState('5');
  const [longBreak, setLongBreak] = useState('15');

  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('pomodoroSettings');
        if (raw) {
          const s = JSON.parse(raw);
          if (s.focus) setFocus(String(s.focus));
          if (s.shortBreak) setShortBreak(String(s.shortBreak));
          if (s.longBreak) setLongBreak(String(s.longBreak));
        }
        const inApp = await AsyncStorage.getItem('notifyDueInApp');
        const email = await AsyncStorage.getItem('notifyDueEmail');
        if (inApp !== null) setNotifyInApp(inApp === 'true');
        if (email !== null) setNotifyEmail(email === 'true');

        // Check notification permission status
        const hasPermission = await localNotification.getPermissionStatus();
        setNotificationPermission(hasPermission);
      } catch {}
    };
    load();
  }, []);

  const save = async () => {
    try {
      const toInt = (v: any, def: number) => {
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) && n > 0 ? n : def;
      };
      const payload = {
        focus: toInt(focus, 25),
        shortBreak: toInt(shortBreak, 5),
        longBreak: toInt(longBreak, 15),
      };
      await AsyncStorage.setItem('pomodoroSettings', JSON.stringify(payload));
      await AsyncStorage.setItem('notifyDueInApp', notifyInApp.toString());
      await AsyncStorage.setItem('notifyDueEmail', notifyEmail.toString());
      showSuccess('Saved settings');
    } catch (e: any) {
      showError(e?.message || 'Failed to save settings');
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await localNotification.requestPermission();
      setNotificationPermission(granted);
      if (granted) {
        showSuccess('Notification permission granted');
      } else {
        showError('Notification permission denied');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to request permission');
    }
  };

  const openNotificationSettings = async () => {
    try {
      await localNotification.openSettings();
    } catch (error: any) {
      showError(error?.message || 'Failed to open settings');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Personal Settings</Text>
        <Text style={styles.subtitle}>Configure Pomodoro and notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pomodoro Durations (minutes)</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Focus</Text>
              <TextInput
                value={focus}
                onChangeText={setFocus}
                keyboardType="number-pad"
                style={styles.input}
                placeholder="25"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Break</Text>
              <TextInput
                value={shortBreak}
                onChangeText={setShortBreak}
                keyboardType="number-pad"
                style={styles.input}
                placeholder="5"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Long Break</Text>
              <TextInput
                value={longBreak}
                onChangeText={setLongBreak}
                keyboardType="number-pad"
                style={styles.input}
                placeholder="15"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>

          {/* Notification Permission Status */}
          <View style={styles.permissionSection}>
            <View style={styles.permissionStatus}>
              <MaterialIcons
                name={notificationPermission ? 'check-circle' : 'info'}
                size={20}
                color={notificationPermission ? Colors.success : Colors.warning}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionText}>
                  {notificationPermission ? 'Notifications Enabled' : 'Notifications Disabled'}
                </Text>
                <Text style={styles.permissionSubtext}>
                  {notificationPermission
                    ? 'You will receive Pomodoro alerts'
                    : 'Enable to receive Pomodoro alerts'}
                </Text>
              </View>
            </View>

            {!notificationPermission && (
              <TouchableOpacity style={styles.permissionButton} onPress={requestNotificationPermission}>
                <MaterialIcons name="notifications-active" size={16} color={Colors.neutral.white} />
                <Text style={styles.permissionButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            )}

            {notificationPermission && (
              <TouchableOpacity style={styles.settingsButton} onPress={openNotificationSettings}>
                <MaterialIcons name="settings" size={16} color={Colors.primary} />
                <Text style={styles.settingsButtonText}>Notification Settings</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchItem}>
              <MaterialIcons name="notifications" size={20} color={Colors.primary} />
              <Text style={styles.switchLabel}>In App</Text>
            </View>
            <Switch
              value={notifyInApp}
              onValueChange={setNotifyInApp}
              trackColor={{ false: Colors.neutral.light, true: Colors.primary + '80' }}
              thumbColor={notifyInApp ? Colors.primary : Colors.neutral.medium}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchItem}>
              <MaterialIcons name="email" size={20} color={Colors.accent} />
              <Text style={styles.switchLabel}>Email</Text>
            </View>
            <Switch
              value={notifyEmail}
              onValueChange={setNotifyEmail}
              trackColor={{ false: Colors.neutral.light, true: Colors.primary + '80' }}
              thumbColor={notifyEmail ? Colors.primary : Colors.neutral.medium}
            />
          </View>
          <Text style={styles.hint}>We will use these preferences when sending due task reminders.</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <MaterialIcons name="save" size={18} color={Colors.neutral.white} />
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.neutral.dark },
  subtitle: { fontSize: 13, color: Colors.neutral.medium, marginTop: 4 },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: Colors.neutral.white, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.neutral.light },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.dark },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  label: { fontSize: 12, color: Colors.neutral.medium, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.neutral.light, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: Colors.neutral.light + '20' },
  permissionSection: { gap: 12, marginBottom: 12 },
  permissionStatus: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: Colors.neutral.light + '20', borderRadius: 8 },
  permissionText: { fontSize: 14, fontWeight: '600', color: Colors.neutral.dark },
  permissionSubtext: { fontSize: 12, color: Colors.neutral.medium, marginTop: 2 },
  permissionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 8 },
  permissionButtonText: { color: Colors.neutral.white, fontWeight: '600', fontSize: 13 },
  settingsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary + '10', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '30' },
  settingsButtonText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  divider: { height: 1, backgroundColor: Colors.neutral.light + '40', marginVertical: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 14, color: Colors.neutral.dark },
  hint: { fontSize: 11, color: Colors.neutral.medium, marginTop: 6 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 10 },
  saveText: { color: Colors.neutral.white, fontWeight: '700' },
});

export default PersonalSettingsScreen;
