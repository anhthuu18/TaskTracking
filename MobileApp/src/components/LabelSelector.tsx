import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ProjectLabel } from '../types/Project';

interface LabelSelectorProps {
  labels: Omit<ProjectLabel, 'id'>[];
  onLabelsChange: (labels: Omit<ProjectLabel, 'id'>[]) => void;
  // Legacy props for backward compatibility
  selectedLabels?: Omit<ProjectLabel, 'id'>[];
}

const predefinedColors = [
  '#E15A93', // Pink
  '#FF6A5D', // Coral
  '#FF8A00', // Orange
  '#47C272', // Green
  '#643FDB', // Purple
  '#837BE7', // Light Purple
  '#FFE7CC', // Cream
  '#F4D8E8', // Light Pink
];

const LabelSelector: React.FC<LabelSelectorProps> = ({
  labels,
  onLabelsChange,
  selectedLabels,
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  
  // Use new props or fallback to legacy props
  const actualLabels = labels || selectedLabels || [];

  const addLabel = (color: string) => {
    const newLabel = {
      name: `Label ${actualLabels.length + 1}`,
      color,
    };
    onLabelsChange([...actualLabels, newLabel]);
  };

  const removeLabel = (index: number) => {
    const updatedLabels = actualLabels.filter((_, i) => i !== index);
    onLabelsChange(updatedLabels);
  };

  return (
    <View style={styles.container}>
      {/* Selected Labels */}
      {actualLabels.length > 0 && (
        <View style={styles.selectedLabelsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectedLabels}>
              {actualLabels.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.selectedLabel, { backgroundColor: label.color }]}
                  onPress={() => removeLabel(index)}
                >
                  <Text style={styles.selectedLabelText}>{label.name}</Text>
                  <MaterialIcons name="close" size={14} color={Colors.surface} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Color Options */}
      <View style={styles.colorOptions}>
        {predefinedColors.map((color, index) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColorIndex === index && styles.selectedColorOption,
            ]}
            onPress={() => addLabel(color)}
          >
            {actualLabels.some(label => label.color === color) && (
              <MaterialIcons name="check" size={16} color={Colors.surface} />
            )}
          </TouchableOpacity>
        ))}
        
        {/* Add More Button */}
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => addLabel(predefinedColors[selectedColorIndex])}
        >
          <MaterialIcons name="add" size={16} color={Colors.neutral.medium} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectedLabelsContainer: {
    marginBottom: 12,
  },
  selectedLabels: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedLabelText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: Colors.neutral.dark,
  },
  addMoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.light,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    borderStyle: 'dashed',
  },
});

export default LabelSelector;
