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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import {
  ScreenLayout,
  ButtonStyles,
  Typography,
} from '../constants/Dimensions';
import { workspaceService } from '../services';
import { WorkspaceType } from '../types';
import { useToastContext } from '../context/ToastContext';

interface CreateWorkspaceScreenProps {
  navigation: any;
  route?: any;
}

const CreateWorkspaceScreen: React.FC<CreateWorkspaceScreenProps> = ({
  navigation,
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'group'>(
    'group',
  );
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToastContext();

  // States for member invitation (only for group workspace)
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddEmail = () => {
    const email = currentEmail.trim();
    if (!email) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({
        ...errors,
        currentEmail: 'Please enter a valid email address',
      });
      return;
    }

    if (inviteEmails.includes(email)) {
      setErrors({
        ...errors,
        currentEmail: 'This email has already been added',
      });
      return;
    }

    setInviteEmails([...inviteEmails, email]);
    setCurrentEmail('');
    setErrors({ ...errors, currentEmail: '' });
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInviteEmails(inviteEmails.filter(email => email !== emailToRemove));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required';
    } else if (workspaceName.trim().length < 3) {
      newErrors.workspaceName = 'Workspace name must be at least 3 characters';
    } else if (workspaceName.trim().length > 100) {
      newErrors.workspaceName = 'Workspace name must not exceed 100 characters';
    }

    // Validate description length
    if (description.trim().length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
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

      // Auto-add current email to the list if it's not empty and valid
      let emailsToInvite = [...inviteEmails];
      if (currentEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(currentEmail.trim())) {
          // Check if email is not already in the list
          if (!emailsToInvite.includes(currentEmail.trim())) {
            emailsToInvite.push(currentEmail.trim());
          }
        }
      }

      const workspaceData = {
        workspaceName: workspaceName.trim(),
        description: description.trim() || undefined,
        workspaceType:
          workspaceType === 'group'
            ? WorkspaceType.GROUP
            : WorkspaceType.PERSONAL,
      };

      const response = await workspaceService.createWorkspace(workspaceData);

      if (response.success) {
        // Save workspace to AsyncStorage
        await AsyncStorage.setItem(
          'lastUsedWorkspaceId',
          response.data.id.toString(),
        );

        // Prepare workspace object for navigation
        const workspaceForNav = {
          id: response.data.id,
          name: response.data.workspaceName,
          workspaceName: response.data.workspaceName,
          memberCount: response.data.memberCount || 1,
          type: workspaceType,
        };

        // If it's a group workspace and email is provided, send invitation
        if (workspaceType === 'group' && emailsToInvite.length > 0) {
          try {
            const invitationPromises = emailsToInvite.map(email =>
              workspaceService.inviteMember(
                response.data.id,
                email,
                'MEMBER',
                inviteMessage.trim() || undefined,
              ),
            );

            await Promise.all(invitationPromises);

            showSuccess(
              `Workspace created and invitations sent to ${
                emailsToInvite.length
              } member${emailsToInvite.length > 1 ? 's' : ''}`,
            );

            // Navigate to Main with the new workspace
            navigation.navigate('Main', { workspace: workspaceForNav });
          } catch (inviteError: any) {
            showError(
              'Workspace created successfully, but some invitations failed to send.',
            );

            navigation.navigate('Main', { workspace: workspaceForNav });
          }
        } else {
          // Navigate directly to Main with the new workspace
          navigation.navigate('Main', { workspace: workspaceForNav });
        }
      } else {
        setErrors({
          general: response.message || 'Failed to create workspace',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('401')
      ) {
        try {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        } catch (e) {
          // Silent fail
        }

        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('SignIn');
              },
            },
          ],
        );
      } else {
        setErrors({ general: error.message || 'Failed to create workspace' });
      }
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
              errors.workspaceName && styles.textInputError,
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.workspaceName && styles.inputOutlineError,
            ]}
            theme={{
              colors: {
                primary: errors.workspaceName
                  ? Colors.semantic.error
                  : Colors.primary,
                outline: errors.workspaceName
                  ? Colors.semantic.error
                  : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon
                icon={() => (
                  <MaterialIcons
                    name="person"
                    size={20}
                    color={Colors.neutral.medium}
                  />
                )}
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
                <MaterialIcons
                  name={workspaceType === 'group' ? 'groups' : 'person'}
                  size={20}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.dropdownText}>
                  {workspaceType === 'group' ? 'Group' : 'Personal'}
                </Text>
              </View>
              <MaterialIcons
                name={
                  showTypeDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
                }
                size={24}
                color={Colors.neutral.medium}
              />
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
                  <MaterialIcons
                    name="person"
                    size={20}
                    color={Colors.neutral.medium}
                  />
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
                  <MaterialIcons
                    name="groups"
                    size={20}
                    color={Colors.neutral.medium}
                  />
                  <Text style={styles.dropdownOptionText}>Group</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Description (Optional)</Text>
          <TextInput
            mode="outlined"
            placeholder="Workspace description..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            style={[
              styles.textInput,
              styles.multilineTextInput,
              errors.description && styles.textInputError,
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.description && styles.inputOutlineError,
            ]}
            contentStyle={styles.multilineContent}
            theme={{
              colors: {
                primary: errors.description
                  ? Colors.semantic.error
                  : Colors.primary,
                outline: errors.description
                  ? Colors.semantic.error
                  : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon
                icon={() => (
                  <MaterialIcons
                    name="description"
                    size={20}
                    color={Colors.neutral.medium}
                  />
                )}
              />
            }
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
          <Text style={styles.characterCount}>
            {description.length}/500 characters
          </Text>
        </View>

        {/* Member Invitation - Only for Group Workspace */}
        {workspaceType === 'group' && (
          <>
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Invite Member (Optional)</Text>

              {/* Email Input with Add Button */}
              <View style={styles.emailInputRow}>
                <View style={styles.emailInputContainer}>
                  <TextInput
                    mode="outlined"
                    placeholder="Enter email address..."
                    value={currentEmail}
                    onChangeText={text => {
                      setCurrentEmail(text);
                      if (errors.currentEmail) {
                        setErrors({ ...errors, currentEmail: '' });
                      }
                    }}
                    style={[
                      styles.textInput,
                      styles.emailInput,
                      errors.currentEmail && styles.textInputError,
                    ]}
                    outlineStyle={[
                      styles.inputOutline,
                      errors.currentEmail && styles.inputOutlineError,
                    ]}
                    theme={{
                      colors: {
                        primary: errors.currentEmail
                          ? Colors.semantic.error
                          : Colors.primary,
                        outline: errors.currentEmail
                          ? Colors.semantic.error
                          : Colors.neutral.light,
                        onSurface: Colors.text,
                      },
                    }}
                    left={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="email"
                            size={20}
                            color={Colors.neutral.medium}
                          />
                        )}
                      />
                    }
                    onSubmitEditing={handleAddEmail}
                  />
                </View>
                <TouchableOpacity
                  style={styles.addEmailButton}
                  onPress={handleAddEmail}
                >
                  <MaterialIcons
                    name="add"
                    size={24}
                    color={Colors.neutral.white}
                  />
                </TouchableOpacity>
              </View>

              {errors.currentEmail && (
                <Text style={styles.errorText}>{errors.currentEmail}</Text>
              )}

              {/* List of Added Emails */}
              {inviteEmails.length > 0 && (
                <View style={styles.emailListContainer}>
                  <Text style={styles.emailListTitle}>
                    Invited Members ({inviteEmails.length})
                  </Text>
                  {inviteEmails.map((email, index) => (
                    <View key={index} style={styles.emailChip}>
                      <Text style={styles.emailChipText}>{email}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveEmail(email)}
                        style={styles.removeEmailButton}
                      >
                        <MaterialIcons
                          name="close"
                          size={18}
                          color={Colors.neutral.medium}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>
                Invitation Message (Optional)
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Add a personal message..."
                value={inviteMessage}
                onChangeText={setInviteMessage}
                multiline
                numberOfLines={3}
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
                    icon={() => (
                      <MaterialIcons
                        name="message"
                        size={20}
                        color={Colors.neutral.medium}
                      />
                    )}
                  />
                }
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            isLoading && styles.createButtonDisabled,
          ]}
          onPress={handleCreateWorkspace}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.createButtonText,
              isLoading && styles.createButtonTextDisabled,
            ]}
          >
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
  characterCount: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 4,
    marginLeft: 12,
    textAlign: 'right',
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  emailInputContainer: {
    flex: 1,
  },
  emailInput: {
    flex: 1,
  },
  addEmailButton: {
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  emailListContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.neutral.ultraLight,
    borderRadius: 12,
  },
  emailListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  emailChipText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  removeEmailButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default CreateWorkspaceScreen;
