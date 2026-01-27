import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { COLORS, SIZES } from '../utils/constants';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  variant?: 'horizontal' | 'vertical';
}

export function Stepper({ steps, currentStep, variant = 'horizontal' }: StepperProps) {
  if (variant === 'vertical') {
    return <VerticalStepper steps={steps} currentStep={currentStep} />;
  }
  return <HorizontalStepper steps={steps} currentStep={currentStep} />;
}

function HorizontalStepper({ steps, currentStep }: { steps: Step[]; currentStep: number }) {
  return (
    <View style={styles.horizontalContainer}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <View style={styles.horizontalStep}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.completedCircle,
                  isActive && styles.activeCircle,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.textWhite} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      (isActive || isCompleted) && styles.activeStepNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  isActive && styles.activeStepTitle,
                  isCompleted && styles.completedStepTitle,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.completedConnector,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function VerticalStepper({ steps, currentStep }: { steps: Step[]; currentStep: number }) {
  return (
    <View style={styles.verticalContainer}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <Animated.View
            key={index}
            entering={FadeInRight.delay(index * 100)}
            style={styles.verticalStep}
          >
            <View style={styles.verticalLeft}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.completedCircle,
                  isActive && styles.activeCircle,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.textWhite} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      (isActive || isCompleted) && styles.activeStepNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.verticalConnector,
                    isCompleted && styles.completedConnector,
                  ]}
                />
              )}
            </View>
            <View style={styles.verticalContent}>
              <Text
                style={[
                  styles.verticalTitle,
                  isActive && styles.activeStepTitle,
                  isCompleted && styles.completedStepTitle,
                ]}
              >
                {step.title}
              </Text>
              {step.description && (
                <Text style={styles.verticalDescription}>{step.description}</Text>
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
  },
  horizontalStep: {
    alignItems: 'center',
    maxWidth: 80,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.xs,
  },
  completedConnector: {
    backgroundColor: COLORS.primary,
  },
  
  // Vertical
  verticalContainer: {
    paddingVertical: SIZES.md,
  },
  verticalStep: {
    flexDirection: 'row',
  },
  verticalLeft: {
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  verticalConnector: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.xs,
  },
  verticalContent: {
    flex: 1,
    paddingBottom: SIZES.lg,
  },
  verticalTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  verticalDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  
  // Shared
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  activeCircle: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  completedCircle: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepNumber: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeStepNumber: {
    color: COLORS.textWhite,
  },
  stepTitle: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  activeStepTitle: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  completedStepTitle: {
    color: COLORS.success,
  },
});
