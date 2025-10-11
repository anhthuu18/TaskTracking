import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { TextInput } from 'react-native-paper';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ScreenLayout, ButtonStyles, Typography } from '../constants/Dimensions';
import { workspaceService } from '../services';
import { WorkspaceType } from '../types';

interface CreateWorkspaceScreenProps {
  navigation: any;
  route?: any;
}

const CreateWorkspaceScreen: React.FC<CreateWorkspaceScreenProps> = ({ navigation }) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'group'>('group');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateWorkspace = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const workspaceData = {
        workspaceName: workspaceName.trim(),
        description: description.trim() || undefined,
        workspaceType: workspaceType === 'group' ? WorkspaceType.GROUP : WorkspaceType.PERSONAL,
      };
      
      const response = await workspaceService.createWorkspace(workspaceData);
      
      if (response.success) {
        // Navigate back to workspace selection with refresh
        navigation.navigate('WorkspaceSelection', { refresh: true });
      } else {
        console.error('Failed to create workspace:', response.message);
        setErrors({ general: response.message || 'Failed to create workspace' });
      }
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      setErrors({ general: error.message || 'Failed to create workspace' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create workspace</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workspace Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Anhthuu18 project"
            value={workspaceName}
            onChangeText={setWorkspaceName}
            style={[
              styles.textInput,
              errors.workspaceName && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.workspaceName && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.workspaceName ? Colors.semantic.error : Colors.primary,
                outline: errors.workspaceName ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="person" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          {errors.workspaceName && (
            <Text style={styles.errorText}>{errors.workspaceName}</Text>
          )}
        </View>

        {/* Workspace Type */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Workspace type</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <View style={styles.dropdownContent}>
                <MaterialIcons name={workspaceType === 'group' ? 'groups' : 'person'} size={20} color={Colors.neutral.medium} />
                <Text style={styles.dropdownText}>
                  {workspaceType === 'group' ? 'Group' : 'Personal'}
                </Text>
              </View>
              <MaterialIcons name={showTypeDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setWorkspaceType('personal');
                    setShowTypeDropdown(false);
                  }}
                >
                  <MaterialIcons name="person" size={20} color={Colors.neutral.medium} />
                  <Text style={styles.dropdownOptionText}>Personal</Text>
                </TouchableOpacity>
                <View style={styles.dropdownSeparator} />
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setWorkspaceType('group');
                    setShowTypeDropdown(false);
                  }}
                >
                  <MaterialIcons name="groups" size={20} color={Colors.neutral.medium} />
                  <Text style={styles.dropdownOptionText}>Group</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Description */} 
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Workspace description..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            style={[styles.textInput, styles.multilineTextInput]}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.multilineContent}
            theme={{  
              colors: {
                primary: Colors.primary,
                outline: Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="mail-outline" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
        </View>
      </ScrollView>


      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateWorkspace}
          disabled={isLoading}
        >
          <Text style={[styles.createButtonText, isLoading && styles.createButtonTextDisabled]}>
            {isLoading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
        
        {/* Error Message */}
        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.headerTopSpacing,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 44, // Compensate for back button width
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.contentTopSpacing,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: Colors.neutral.light,
    marginHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: Colors.background,
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  textInputError: {
    backgroundColor: Colors.background,
  },
  inputOutlineError: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.semantic.error,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
    paddingTop: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    ...ButtonStyles.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: Colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  createButtonText: {
    ...Typography.buttonText,
    color: Colors.neutral.white,
  },
  createButtonTextDisabled: {
    color: Colors.neutral.medium,
  },
  multilineTextInput: {
    minHeight: 120,
  },
  multilineContent: {
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});

export default CreateWorkspaceScreen;
