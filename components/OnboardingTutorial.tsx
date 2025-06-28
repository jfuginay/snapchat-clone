import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAppSelector } from '../store'

const { width, height } = Dimensions.get('window')

interface TutorialStep {
  id: number
  title: string
  content: string
  icon: string
  highlights?: string[]
  actionButton?: {
    text: string
    action: () => void
  }
}

interface OnboardingTutorialProps {
  visible: boolean
  onComplete: () => void
  onSkip: () => void
  startFromStep?: number
}

export default function OnboardingTutorial({ 
  visible, 
  onComplete, 
  onSkip, 
  startFromStep = 0 
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(startFromStep)
  const { user } = useAppSelector((state: any) => state.auth)
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Start animations when visible
  useEffect(() => {
    if (visible) {
      // Pulse animation for icons
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,  
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Glow animation for highlights
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
  }, [visible, pulseAnim, glowAnim])

  // Slide in animation when step changes
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-width)
      fadeAnim.setValue(0)
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [currentStep, visible, slideAnim, fadeAnim])

  const tutorialSteps: TutorialStep[] = [
    {
      id: 0,
      title: `Hey ${user?.display_name || 'Friend'}! 👋`,
      content: `Welcome to TribeFind!\nYour AI-powered tribe discovery starts here.`,
      icon: '🎯',
      highlights: [
        'Find your tribe instantly',
        'AI matches you perfectly',
        'Location + interests magic'
      ]
    },
    {
      id: 1,
      title: 'Capture & Share 📸',
      content: `Tap the camera to capture moments\nwith pro filters and instant sharing.`,
      icon: '📷',
      highlights: [
        'Snapchat-quality camera',
        'Real-time filters',
        'Instant cloud backup'
      ]
    },
    {
      id: 2,
      title: 'Discover Your Tribe 🗺️',
      content: `Our AI finds people who share your vibe.\nLocation + interests = perfect matches.`,
      icon: '✨',
      highlights: [
        'Smart AI recommendations',
        'Real-time tribe discovery',
        'Privacy-first matching'
      ]
    },
    {
      id: 3,
      title: `Ready to Vibe! 🚀`,
      content: `You're all set to find your tribe!\nStart exploring and making connections.`,
      icon: '🎉',
      highlights: [
        'Everything unlocked',
        'Start discovering now',
        'Your tribe awaits!'
      ]
    }
  ]

  const currentStepData = tutorialSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tutorialSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    Alert.alert(
      'Skip Tutorial?',
      'You can always access this walkthrough later from the "View Walkthrough" button.',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onSkip }
      ]
    )
  }

  const progressPercentage = ((currentStep + 1) / tutorialSteps.length) * 100

  // Animation interpolations
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  })

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  })

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header with dots and skip */}
            <View style={styles.header}>
              <View style={styles.dotsContainer}>
                {tutorialSteps.map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      currentStep === index && styles.activeDot,
                      currentStep === index && {
                        opacity: glowOpacity,
                        transform: [{ scale: pulseScale }]
                      }
                    ]}
                  />
                ))}
              </View>
              
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Main Content */}
            <Animated.View 
              style={[
                styles.content,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: fadeAnim,
                }
              ]}
            >
              {/* Large Icon with Pulse */}
              <Animated.View 
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseScale }],
                  }
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
                </LinearGradient>
              </Animated.View>

              {/* Title */}
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>

              {/* Content */}
              <Text style={styles.stepContent}>{currentStepData.content}</Text>

              {/* Glowing Highlights */}
              {currentStepData.highlights && (
                <View style={styles.highlightsContainer}>
                  {currentStepData.highlights.map((highlight, index) => (
                    <Animated.View 
                      key={index} 
                      style={[
                        styles.highlightItem,
                        {
                          opacity: glowOpacity,
                        }
                      ]}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                        style={styles.highlightGradient}
                      >
                        <Text style={styles.highlightText}>{highlight}</Text>
                      </LinearGradient>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Large Next Button */}
            <View style={styles.navigation}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
                  <LinearGradient
                    colors={['#FF6B6B', '#4ECDC4']}
                    style={styles.nextButtonGradient}
                  >
                    <Text style={styles.nextButtonText}>
                      {isLastStep ? 'Let\'s Go! 🚀' : currentStep === 0 ? 'Start Tour' : 'Next →'}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  stepIcon: {
    fontSize: 60,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stepContent: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  highlightsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  highlightItem: {
    marginBottom: 12,
    width: '100%',
  },
  highlightGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  highlightText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  navigation: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  nextButton: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
}) 