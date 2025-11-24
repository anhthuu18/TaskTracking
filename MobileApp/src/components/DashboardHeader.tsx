import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

export interface HeaderAction {
  icon: string;
  onPress: () => void;
  badgeCount?: number;
  testID?: string;
}

interface DashboardHeaderProps {
  username: string;
  subtitle?: string;
  actions?: HeaderAction[];
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearchBar: boolean;
  onToggleSearchBar: (show: boolean) => void;
  onClearSearch?: () => void;
  showSearchOptionsButton?: boolean;
  onSearchOptionsPress?: () => void;
  searchOptionsActive?: boolean;
  enableSearch?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  username,
  subtitle,
  actions = [],
  searchPlaceholder = 'Search...',
  searchQuery,
  onSearchChange,
  showSearchBar,
  onToggleSearchBar,
  onClearSearch,
  showSearchOptionsButton = false,
  onSearchOptionsPress,
  searchOptionsActive = false,
  enableSearch = true,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>Hi, {username}!</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.actionsRow}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={`${action.icon}-${index}`}
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
              testID={action.testID}
            >
              <MaterialIcons name={action.icon as any} size={24} color={Colors.neutral.dark} />
              {action.badgeCount && action.badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {action.badgeCount > 99 ? '99+' : action.badgeCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {enableSearch && !showSearchBar ? (
        <View style={styles.searchTriggerRow}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => onToggleSearchBar(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="search" size={20} color={Colors.neutral.medium} />
            <Text style={styles.searchButtonText}>{searchPlaceholder}</Text>
          </TouchableOpacity>
          {showSearchOptionsButton && onSearchOptionsPress ? (
            <TouchableOpacity
              style={[
                styles.optionsButton,
                searchOptionsActive && styles.optionsButtonActive,
              ]}
              onPress={onSearchOptionsPress}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="tune"
                size={20}
                color={searchOptionsActive ? Colors.primary : Colors.neutral.medium}
              />
              {searchOptionsActive ? (
                <View style={styles.optionsIndicator}>
                  <MaterialIcons name="filter-list" size={10} color={Colors.primary} />
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {enableSearch && showSearchBar ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchBarRow}>
            <TextInput
              mode="outlined"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={onSearchChange}
              style={styles.searchInput}
              outlineStyle={styles.searchOutline}
              theme={{
                colors: {
                  primary: Colors.primary,
                  outline: Colors.neutral.light,
                  onSurface: Colors.neutral.dark,
                },
              }}
              left={
                <TextInput.Icon
                  icon={() => <MaterialIcons name="search" size={20} color={Colors.neutral.medium} />}
                />
              }
              right={
                <TextInput.Icon
                  icon={() => (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => {
                        onClearSearch?.();
                        onSearchChange('');
                        onToggleSearchBar(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={18} color={Colors.neutral.medium} />
                    </TouchableOpacity>
                  )}
                />
              }
            />
            {showSearchOptionsButton && onSearchOptionsPress ? (
              <TouchableOpacity
                style={[
                  styles.optionsButton,
                  searchOptionsActive && styles.optionsButtonActive,
                ]}
                onPress={onSearchOptionsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="tune"
                  size={20}
                  color={searchOptionsActive ? Colors.primary : Colors.neutral.medium}
                />
                {searchOptionsActive ? (
                  <View style={styles.optionsIndicator}>
                    <MaterialIcons name="filter-list" size={10} color={Colors.primary} />
                  </View>
                ) : null}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.neutral.light + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    minHeight: 16,
    borderRadius: 8,
    backgroundColor: Colors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  searchTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.neutral.light + '40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchButtonText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  optionsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.neutral.light + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginTop: 4,
    width: '100%',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    backgroundColor: Colors.neutral.white,
    flex: 1,
  },
  searchOutline: {
    borderRadius: 12,
    borderWidth: 1.2,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.neutral.light + '40',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionsButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  optionsIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default DashboardHeader;

