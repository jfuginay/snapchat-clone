import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native'
import { useAppSelector } from '../store'
import { useAuth } from '../services/AuthService'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

export default function ProfileScreen() {
  const { user } = useAppSelector((state) => state.auth)
  const { signOut, linkTwitterAccount } = useAuth()
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [twitterLinking, setTwitterLinking] = useState(false)
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

  const goToHomeLocationSettings = () => {
    navigation.navigate('HomeLocationSettings' as never)
  }

  const goToActivitiesSettings = () => {
    navigation.navigate('Activities' as never)
  }

  const handleTwitterLink = async () => {
    try {
      setTwitterLinking(true)

      const result = await linkTwitterAccount()

      if (result.error) {
        Alert.alert('Twitter Linking Error', result.error)
      } else {
        Alert.alert(
          'Twitter Linking Started',
          'Your browser will open to link your Twitter account. After authorization, return to the app.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while linking Twitter account')
    } finally {
      setTwitterLinking(false)
    }
  }

  if (!user) {
    return null
  }

  const displayUser = updatedUser || user
  const hasTwitterLinked = displayUser?.social_accounts?.twitter?.id

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
          
          {/* Twitter Account Status */}
          {hasTwitterLinked && (
            <View style={styles.twitterBadge}>
              <Text style={styles.twitterBadgeText}>
                🐦 Linked to @{displayUser.social_accounts.twitter.username}
              </Text>
            </View>
          )}
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

          <TouchableOpacity style={styles.settingItem} onPress={goToHomeLocationSettings}>
            <Text style={styles.settingIcon}>🏠</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Home Location</Text>
              <Text style={styles.settingSubtitle}>Set your home address</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={goToActivitiesSettings}>
            <Text style={styles.settingIcon}>🎯</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Activities & Interests</Text>
              <Text style={styles.settingSubtitle}>Select your favorite activities</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          {/* Twitter Account Linking */}
          <TouchableOpacity 
            style={[styles.settingItem, twitterLinking && styles.settingItemDisabled]} 
            onPress={handleTwitterLink}
            disabled={twitterLinking || hasTwitterLinked}
          >
            <Text style={styles.settingIcon}>🐦</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                {hasTwitterLinked ? 'Twitter Account' : 'Link Twitter'}
              </Text>
              <Text style={styles.settingSubtitle}>
                {hasTwitterLinked 
                  ? `Connected to @${displayUser.social_accounts.twitter.username}` 
                  : 'Connect your Twitter account'
                }
              </Text>
            </View>
            <Text style={[
              styles.settingArrow, 
              hasTwitterLinked && styles.settingArrowLinked
            ]}>
              {twitterLinking ? '⏳' : hasTwitterLinked ? '✅' : '›'}
            </Text>
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

        {/* Social Accounts Section */}
        <View style={styles.settings}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          
          {hasTwitterLinked ? (
            <View style={styles.connectedAccountItem}>
              <Text style={styles.settingIcon}>🐦</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Twitter</Text>
                <Text style={styles.settingSubtitle}>
                  @{displayUser.social_accounts.twitter.username}
                  {displayUser.social_accounts.twitter.verified && ' ✓'}
                </Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAccountsItem}>
              <Text style={styles.noAccountsText}>
                💡 Link your social accounts to expand your network and discover more tribe members
              </Text>
            </View>
          )}
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
    backgroundColor: '#6366f1',
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
  twitterBadge: {
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  twitterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectedAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  connectedBadge: {
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  connectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noAccountsItem: {
    padding: 20,
    alignItems: 'center',
  },
  noAccountsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  settingItemDisabled: {
    backgroundColor: '#f0f0f0',
  },
  settingArrowLinked: {
    color: '#000',
  },
}) 