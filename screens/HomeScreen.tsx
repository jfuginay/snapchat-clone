import React, { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAppSelector } from '../store'
import PhotoGallery from '../components/PhotoGallery'
import VideoGallery from '../components/VideoGallery'

type MediaTab = 'photos' | 'videos'

export default function HomeScreen() {
  const { user } = useAppSelector((state: any) => state.auth)
  const [activeTab, setActiveTab] = useState<MediaTab>('photos')

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#a855f7']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.welcome}>Hey {user?.display_name}! 👋</Text>
            <Text style={styles.subtitle}>Your captured moments</Text>
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
    paddingHorizontal: 20,
    marginBottom: 20,
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