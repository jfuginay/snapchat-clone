import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAppSelector } from '../store'
import PhotoGallery from '../components/PhotoGallery'

export default function HomeScreen() {
  const { user } = useAppSelector((state: any) => state.auth)

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

          <View style={styles.feed}>
            <PhotoGallery />
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
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#F0F0F0',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
}) 