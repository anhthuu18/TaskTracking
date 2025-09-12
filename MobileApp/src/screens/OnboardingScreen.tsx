import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Strings } from '../constants/Strings';
import { Colors } from '../constants/Colors';
import { FontSize, Spacing, BorderRadius, Typography, ScreenLayout } from '../constants/Dimensions';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  image?: any;
  placeholderText?: string;
}

interface OnboardingScreenProps {
  onFinish: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Helper function to safely require images with fallback
  const safeRequireImage = (imagePath: string) => {
    try {
      switch (imagePath) {
        case 'onboarding1':
          return require('../assets/images/onboarding1.png');
        case 'onboarding2':
          return require('../assets/images/onboarding2.png');
        case 'onboarding3':
          return require('../assets/images/onboarding3.png');
        default:
          return null;
      }
         } catch (error) {
       return null;
     }
  };

  const onboardingData: OnboardingItem[] = [
    {
      id: '1',
      title: Strings.onboardingTitle1,
      subtitle: Strings.onboardingSubtitle1,
      image: safeRequireImage('onboarding1'),
      placeholderText: '📋',
    },
    {
      id: '2',
      title: Strings.onboardingTitle2,
      subtitle: Strings.onboardingSubtitle2,
      image: safeRequireImage('onboarding2'),
      placeholderText: '⚡',
    },
    {
      id: '3',
      title: Strings.onboardingTitle3,
      subtitle: Strings.onboardingSubtitle3,
      image: safeRequireImage('onboarding3'),
      placeholderText: '🎯',
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const renderOnboardingItem = ({ item }: { item: OnboardingItem }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        {item.image ? (
          // Show actual image if available
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        ) : (
          // Show placeholder if no image
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>{item.placeholderText}</Text>
            <Text style={styles.placeholderText}>Đang tải ảnh</Text>
            <Text style={styles.placeholderSubtext}>
              {item.id === '1' && 'Quản lý công việc hiệu quả'}
              {item.id === '2' && 'Theo dõi tiến độ thông minh'}
              {item.id === '3' && 'Phân tích hiệu suất chi tiết'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: index === currentIndex ? Colors.primary : Colors.neutral.light },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Skip and Back buttons */}
      <View style={styles.header}>
        {currentIndex > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <View style={styles.spacer} />
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>{Strings.skip}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Onboarding content */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderOnboardingItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false} // Disable manual scrolling, use buttons only
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom section with pagination and button */}
      <View style={styles.bottomContainer}>
        {renderPaginationDots()}
        
        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
          <Text style={styles.actionButtonText}>
            {currentIndex === onboardingData.length - 1 
              ? Strings.getStarted 
              : Strings.next}
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
    paddingTop: ScreenLayout.safeAreaTopPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  spacer: {
    flex: 1,
  },
  skipButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  skipButtonText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  image: {
    width: screenWidth * 0.85, // 85% of screen width for better balance
    height: screenWidth * 0.85,
    borderRadius: BorderRadius.lg,
  },
  imagePlaceholder: {
    width: screenWidth * 0.85,
    height: screenWidth * 0.85,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderEmoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  placeholderText: {
    ...Typography.header2,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...Typography.title,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  bottomContainer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    minWidth: 200,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    ...Typography.body,
    color: Colors.neutral.white,
  },
});

export default OnboardingScreen;
