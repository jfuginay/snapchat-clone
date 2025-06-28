import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAppSelector, useAppDispatch } from '../store'
import { setTutorialVisible, completeTutorial, skipTutorial, markUserAsReturning } from '../store/tutorialSlice'
import PhotoGallery from '../components/PhotoGallery'
import VideoGallery from '../components/VideoGallery'
import OnboardingTutorial from '../components/OnboardingTutorial'

type MediaTab = 'photos' | 'videos'

export default function HomeScreen() {
  const { user } = useAppSelector((state: any) => state.auth)
  const { tutorialVisible, firstTimeUser, hasCompletedOnboarding } = useAppSelector((state: any) => state.tutorial)
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<MediaTab>('photos')

  // Show tutorial for first-time users
  useEffect(() => {
    if (firstTimeUser && !hasCompletedOnboarding && user) {
      // Show tutorial after a short delay to let the user see the interface first
      const timer = setTimeout(() => {
        dispatch(setTutorialVisible(true))
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [firstTimeUser, hasCompletedOnboarding, user, dispatch])

  const handleShowTutorial = () => {
    dispatch(setTutorialVisible(true))
  }

  const handleTutorialComplete = () => {
    dispatch(completeTutorial())
  }

  const handleTutorialSkip = () => {
    dispatch(skipTutorial())
  }

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#a855f7']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcome}>Hey {user?.display_name}! 👋</Text>
              <Text style={styles.subtitle}>Your captured moments</Text>
            </View>
            
            {/* View Walkthrough Button */}
            {hasCompletedOnboarding && (
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={handleShowTutorial}
              >
                <Text style={styles.tutorialButtonText}>📚 View Walkthrough</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
              onPress={() => setActiveTab('photos')}
            >
              <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
                📸 Photos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
              onPress={() => setActiveTab('videos')}
            >
              <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
                🎥 Videos
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feed}>
            {activeTab === 'photos' ? (
              <PhotoGallery />
            ) : (
              <VideoGallery />
            )}
          </View>
        </View>

        {/* Onboarding Tutorial */}
        <OnboardingTutorial
          visible={tutorialVisible}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          startFromStep={0}
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  tutorialButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 5,
  },
  tutorialButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
  activeTabText: {
    color: '#6366f1',
  },
  feed: {
    flex: 1,
  },
}) 