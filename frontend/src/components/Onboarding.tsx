import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'medical',
    iconColor: COLORS.primary,
    title: 'Bem-vindo ao RenoveJá',
    description: 'Sua saúde digital em um só lugar. Renove receitas, solicite exames e consulte médicos sem sair de casa.',
  },
  {
    id: '2',
    icon: 'document-text',
    iconColor: COLORS.healthGreen,
    title: 'Renove suas Receitas',
    description: 'Envie uma foto da sua receita antiga e receba a renovação de forma rápida e segura, com avaliação médica.',
  },
  {
    id: '3',
    icon: 'flask',
    iconColor: COLORS.healthPurple,
    title: 'Solicite Exames',
    description: 'Peça exames laboratoriais e de imagem. Nossa equipe de enfermagem faz a triagem para agilizar seu atendimento.',
  },
  {
    id: '4',
    icon: 'videocam',
    iconColor: COLORS.healthOrange,
    title: 'Consultas por Vídeo',
    description: 'Converse com médicos especialistas por videochamada. Rápido, prático e dentro das normas do CFM.',
  },
  {
    id: '5',
    icon: 'shield-checkmark',
    iconColor: COLORS.success,
    title: 'Segurança Total',
    description: 'Seus dados são protegidos e todas as receitas são assinadas digitalmente. 100% seguro e legal.',
  },
];

export function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}> 
        <Animated.View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '20' }]}>
            <Ionicons name={item.icon} size={80} color={item.iconColor} />
          </View>
        </Animated.View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive && styles.activeDot,
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Pular</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        bounces={false}
      />

      {/* Bottom section */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + SIZES.lg }]}>
        {renderDots()}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentIndex === slides.length - 1 && styles.lastButton,
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          {currentIndex === slides.length - 1 ? (
            <Text style={styles.nextButtonText}>Começar</Text>
          ) : (
            <Ionicons name="arrow-forward" size={24} color={COLORS.textWhite} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: SIZES.lg,
    zIndex: 10,
    padding: SIZES.sm,
  },
  skipText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },
  iconContainer: {
    marginBottom: SIZES.xxl,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  description: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.md,
  },
  bottom: {
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  lastButton: {
    width: 'auto',
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusLg,
  },
  nextButtonText: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
});
