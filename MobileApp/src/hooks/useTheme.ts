import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../constants/Colors';

/**
 * Custom hook for theme management
 */
export const useTheme = () => {
  const isDarkMode = useColorScheme() === 'dark';
  
  const colors = isDarkMode ? DarkColors : Colors;
  
  return {
    isDarkMode,
    colors,
  };
};
