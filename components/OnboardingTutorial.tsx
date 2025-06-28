import React, { useState, useEffect } from 'react'
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

  const tutorialSteps: TutorialStep[] = [
    {
      id: 0,
      title: `Welcome to TribeFind, ${user?.display_name || 'Friend'}! 🎯`,
      content: `TribeFind is your AI-powered social discovery platform that helps you find your tribe through shared interests and intelligent location-based connections.\n\nThis quick walkthrough will show you everything you need to know to get started!`,
      icon: '🚀',
      highlights: [
        'AI-powered social discovery',
        'Location-based connections', 
        'Interest matching',
        'Real-time tribe finding'
      ]
    },
    {
      id: 1,
      title: 'Interface Overview 📱',
      content: `Let's explore your main navigation tabs:\n\n🏠 **Home** - Your photo gallery and main dashboard\n📸 **Camera** - Capture and share moments with filters\n💬 **Chat** - Message your tribe members\n🗺️ **Map** - Discover nearby tribe members\n👤 **Profile** - Manage your account and settings`,
      icon: '🧭',
      highlights: [
        'Five main tabs for easy navigation',
        'Each tab has unique features',
        'Seamless switching between features'
      ]
    },
    {
      id: 2,  
      title: 'Camera Magic 📸',
      content: `Your camera isn't just for photos - it's your creative studio!\n\n✨ **Features:**\n• Professional photo capture\n• Real-time filters and effects\n• Front/back camera switching\n• Flash controls\n• Instant cloud backup\n• Gallery integration`,
      icon: '📷',
      highlights: [
        'Snapchat-quality interface',
        'Multiple filter options',
        'Auto-save to cloud',
        'Professional quality photos'
      ]
    },
    {
      id: 3,
      title: 'Map & Location Discovery 🗺️',
      content: `The Map is where the magic happens!\n\n🎯 **Discover:**\n• Nearby tribe members in real-time\n• Interest-based filtering\n• Location sharing controls\n• Privacy-first design\n• Interactive user profiles\n\n**Tip:** Enable location services for the best experience!`,
      icon: '🌍',
      highlights: [
        'Real-time user discovery',
        'Interest-based filtering',
        'Privacy controls',
        'Interactive experience'
      ]
    },
    {
      id: 4,
      title: 'Chat & Messaging 💬',  
      content: `Stay connected with your tribe!\n\n💭 **Features:**\n• Real-time messaging\n• Message history\n• Typing indicators\n• Media sharing\n• Group conversations\n• Friend requests\n\n**Pro Tip:** Send a friend request before messaging someone new!`,
      icon: '📨',
      highlights: [
        'Instant real-time messaging',
        'Rich media support',
        'Friend system integration',
        'Group chat capabilities'
      ]
    },
    {
      id: 5,
      title: 'Set Your Interests 🎨',
      content: `Your interests are the key to finding your tribe!\n\n🎯 **Interest System:**\n• 50+ activity categories\n• Photography, Hiking, Coffee, Tech, Music...\n• Smart matching algorithm\n• Discover similar people\n• Activity suggestions\n\n**Action:** Go to Activities screen to set your interests!`,
      icon: '🎨',
      highlights: [
        '50+ activity categories',
        'Smart matching system',
        'Personalized recommendations',
        'Tribe discovery engine'
      ],
      actionButton: {
        text: 'Set My Interests',
        action: () => {
          Alert.alert(
            'Set Interests',
            'After this tutorial, visit the Activities screen from your profile to set your interests!',
            [{ text: 'Got it!', style: 'default' }]
          )
        }
      }
    },
    {
      id: 6,
      title: 'AI-Powered RAG System 🤖',
      content: `This is what makes TribeFind special - our Retrieval-Augmented Generation (RAG) system!\n\n🧠 **How RAG Works:**\n• Analyzes your location, interests, and social context\n• Provides intelligent recommendations\n• Understands your tribe preferences\n• Suggests activities and meetups\n• Learns from your interactions\n\n**Example:** "What should I do tonight?" → AI considers your location, interests, friends nearby, weather, and time to give personalized suggestions!`,
      icon: '🤖',
      highlights: [
        'Context-aware AI assistance',
        'Personalized recommendations',
        'Location + interest analysis',
        'Smart tribe suggestions',
        'Learns your preferences'
      ]
    },
    {
      id: 7,
      title: 'RAG in Action 🔍',
      content: `Here's how our AI helps you find your tribe:\n\n🎯 **Smart Scenarios:**\n• "Find coffee shops my friends visited"\n• "What activities are popular nearby?"\n• "Recommend places for photography"\n• "Who shares my hiking interests?"\n\nThe AI combines your location, social graph, interests, and real-time data to give you perfect recommendations!`,
      icon: '✨',
      highlights: [
        'Location-aware suggestions',
        'Friend network analysis',
        'Interest-based recommendations',
        'Real-time context understanding'
      ]
    },
    {
      id: 8,
      title: 'Profile & Privacy 👤',
      content: `Your profile is your tribe identity!\n\n⚙️ **Profile Features:**\n• Display name and bio\n• Interest selection\n• Privacy controls\n• Location sharing settings\n• Connected accounts\n• Activity history\n\n🔒 **Privacy:** You control what you share and with whom. Your data stays secure!`,
      icon: '🛡️',
      highlights: [
        'Complete profile customization',
        'Granular privacy controls',
        'Secure data handling',
        'Control your digital presence'
      ]
    },
    {
      id: 9,
      title: `You're Ready to Find Your Tribe! 🎉`,
      content: `Congratulations! You now know everything about TribeFind.\n\n🚀 **Next Steps:**\n1. Set your interests in Activities\n2. Enable location sharing\n3. Take some photos to share\n4. Explore the map for nearby tribe members\n5. Start conversations!\n\n**Remember:** You can always revisit this tutorial from the "View Walkthrough" button on your home screen.\n\nWelcome to your tribe! 🌟`,
      icon: '🎊',
      highlights: [
        'Complete app mastery',
        'Ready to connect',
        'Tutorial always available',
        'Welcome to TribeFind!'
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
      'You can always access this walkthrough later from the "View Walkthrough" button on your home screen.',
      [
        { text: 'Continue Tutorial', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onSkip }
      ]
    )
  }

  const progressPercentage = ((currentStep + 1) / tutorialSteps.length) * 100

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#6366f1']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header with progress */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[styles.progressBar, { width: `${progressPercentage}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {tutorialSteps.length}
              </Text>
            </View>
            
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepContainer}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
              </View>

              {/* Title */}
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>

              {/* Content */}
              <Text style={styles.stepContent}>{currentStepData.content}</Text>

              {/* Highlights */}
              {currentStepData.highlights && (
                <View style={styles.highlightsContainer}>
                  <Text style={styles.highlightsTitle}>✨ Key Features:</Text>
                  {currentStepData.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <Text style={styles.highlightBullet}>•</Text>
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Button */}
              {currentStepData.actionButton && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={currentStepData.actionButton.action}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>
                      {currentStepData.actionButton.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, isFirstStep && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={isFirstStep}
            >
              <Text style={[styles.navButtonText, isFirstStep && styles.navButtonTextDisabled]}>
                ← Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Complete! 🎉' : 'Next →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  progressContainer: {
    flex: 1,
    marginRight: 20,
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  skipButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 30,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    fontSize: 35,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 30,
  },
  stepContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  highlightsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  highlightBullet: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  nextButton: {
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}) 