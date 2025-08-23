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
import { FontSize, Spacing, BorderRadius } from '../constants/Dimensions';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  image?: any; // Will be added later when images are available
}

interface OnboardingScreenProps {
  onFinish: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onboardingData: OnboardingItem[] = [
    {
      id: '1',
      title: Strings.onboardingTitle1,
      subtitle: Strings.onboardingSubtitle1,
      // image: require('../assets/images/onboarding1.png'), // To be added later
    },
    {
      id: '2',
      title: Strings.onboardingTitle2,
      subtitle: Strings.onboardingSubtitle2,
      // image: require('../assets/images/onboarding2.png'), // To be added later
    },
    {
      id: '3',
      title: Strings.onboardingTitle3,
      subtitle: Strings.onboardingSubtitle3,
      // image: require('../assets/images/onboarding3.png'), // To be added later
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
        {/* Placeholder for illustration */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Illustration</Text>
          <Text style={styles.placeholderSubtext}>
            {item.id === '1' && 'Person with task board'}
            {item.id === '2' && 'Person with charts & analytics'}
            {item.id === '3' && 'Person with analytics dashboard'}
          </Text>
        </View>
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
            { backgroundColor: index === currentIndex ? '#7B61FF' : '#E0E0E0' },
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
    backgroundColor: Colors.surface,
    paddingTop: 48,
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
    fontSize: FontSize.md,
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
  imagePlaceholder: {
    width: 300,
    height: 300,
    backgroundColor: '#F0F0F0',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 30,
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
    backgroundColor: '#7B61FF',
    paddingVertical: 18,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    minWidth: 200,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
