import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl 
} from 'react-native'
import { useAppSelector } from '../store'
import { useAuth } from '../services/AuthService'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

export default function ProfileScreen() {
  const { user } = useAppSelector((state) => state.auth)
  const { signOut } = useAuth()
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [realStats, setRealStats] = useState({
    snaps_shared: 0,
    friends_count: 0,
    photos_count: 0
  })
  const [updatedUser, setUpdatedUser] = useState(user)

  useEffect(() => {
    if (user) {
      loadRealStats()
    }
  }, [user])

  // Refresh stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadRealStats()
      }
    }, [user])
  )

  const loadRealStats = async () => {
    if (!user) return

    try {
      console.log('Loading real stats for user:', user.id)
      
      // Get actual photo count from database
      const { count: photoCount, error: photoError } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (photoError) {
        console.error('Error counting photos:', photoError)
      }

      // Get updated user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
      } else {
        setUpdatedUser(userData)
        console.log('Updated user data:', userData)
      }

      // Get friends count (when friendship system is implemented)
      const { count: friendsCount, error: friendsError } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendsError) {
        console.error('Error counting friends:', friendsError)
      }

      const realStatsData = {
        snaps_shared: userData?.stats?.snaps_shared || photoCount || 0,
        friends_count: friendsCount || 0,
        photos_count: photoCount || 0
      }

      setRealStats(realStatsData)
      console.log('Real stats loaded:', realStatsData)
      
    } catch (error) {
      console.error('Error loading real stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRealStats()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const goToLocationSettings = () => {
    navigation.navigate('LocationSettings' as never)
  }

  if (!user) {
    return null
  }

  const displayUser = updatedUser || user

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{displayUser.avatar}</Text>
          </View>
          <Text style={styles.displayName}>{displayUser.display_name}</Text>
          <Text style={styles.username}>@{displayUser.username}</Text>
          <Text style={styles.bio}>{displayUser.bio || 'No bio yet'}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{realStats.snaps_shared}</Text>
            <Text style={styles.statLabel}>Snaps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{realStats.friends_count}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayUser.snap_score || 0}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.photoStats}>
          <Text style={styles.photoStatsText}>
            📸 {realStats.photos_count} photos in gallery
          </Text>
        </View>

        <View style={styles.settings}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={goToLocationSettings}>
            <Text style={styles.settingIcon}>📍</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Location Settings</Text>
              <Text style={styles.settingSubtitle}>Privacy and sharing controls</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>👥</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Friends</Text>
              <Text style={styles.settingSubtitle}>Manage your friends list</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Push notification settings</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 40,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 20,
    borderRadius: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settings: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    padding: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  signOutButton: {
    backgroundColor: '#000',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoStats: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  photoStatsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}) 