import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface CreateWorkspaceScreenProps {
  navigation: any;
  route?: any;
}

const CreateWorkspaceScreen: React.FC<CreateWorkspaceScreenProps> = ({ navigation }) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'group'>('personal');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const handleCreateWorkspace = () => {
    if (!validateForm()) {
      return;
    }

    // TODO: Implement workspace creation API call
    const newWorkspace = {
      name: workspaceName.trim(),
      description: description.trim(),
      type: workspaceType,
    };

    console.log('Creating workspace:', newWorkspace);
    
    // Navigate back to workspace selection
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create workspace</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workspace Type Selection */}
        <View style={styles.typeSection}>
          <Text style={styles.sectionLabel}>Workspace Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                workspaceType === 'personal' && styles.typeButtonActive
              ]}
              onPress={() => setWorkspaceType('personal')}
            >
              <MaterialIcons 
                name="person" 
                size={20} 
                color={workspaceType === 'personal' ? Colors.neutral.white : Colors.neutral.medium} 
              />
              <Text style={[
                styles.typeButtonText,
                workspaceType === 'personal' && styles.typeButtonTextActive
              ]}>
                Personal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                workspaceType === 'group' && styles.typeButtonActive
              ]}
              onPress={() => setWorkspaceType('group')}
            >
              <MaterialIcons 
                name="groups" 
                size={20} 
                color={workspaceType === 'group' ? Colors.neutral.white : Colors.neutral.medium} 
              />
              <Text style={[
                styles.typeButtonText,
                workspaceType === 'group' && styles.typeButtonTextActive
              ]}>
                Group
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Workspace Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Enter workspace name"
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

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Description (Optional)</Text>
          <TextInput
            mode="outlined"
            placeholder="Enter workspace description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textInput}
            outlineStyle={styles.inputOutline}
            theme={{
              colors: {
                primary: Colors.primary,
                outline: Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="description" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateWorkspace}
        >
          <Text style={styles.createButtonText}>
            Create
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  typeSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  typeButtonTextActive: {
    color: Colors.neutral.white,
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  createButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateWorkspaceScreen;
