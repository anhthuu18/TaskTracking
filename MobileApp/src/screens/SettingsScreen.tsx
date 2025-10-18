import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();

  const settingsItems = [
    { id: 'profile', title: 'Profile', icon: '👤' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'privacy', title: 'Privacy & Security', icon: '🔒' },
    { id: 'about', title: 'About', icon: 'ℹ️' },
    { id: 'help', title: 'Help & Support', icon: '❓' },
  ];

  const renderSettingItem = (item: typeof settingsItems[0]) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={() => {
        // Handle setting item press
        console.log(`Pressed ${item.title}`);
      }}
    >
      <Text style={styles.settingIcon}>{item.icon}</Text>
      <Text style={[styles.settingTitle, { color: colors.text }]}>
        {item.title}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your preferences
          </Text>
        </View>
        
        <View style={styles.settingsContainer}>
          {settingsItems.map(renderSettingItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});

export default SettingsScreen;
