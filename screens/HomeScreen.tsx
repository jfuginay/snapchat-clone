import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useAppSelector } from '../store'
import PhotoGallery from '../components/PhotoGallery'

export default function HomeScreen() {
  const { user } = useAppSelector((state: any) => state.auth)

  return (
    <SafeAreaView style={styles.container}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00',
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
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
}) 