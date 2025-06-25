import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  bio: string;
  shared_activities: number;
  friendship_status?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  distance?: number;
}

const UserSearchScreen: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMode, setSearchMode] = useState<'nearby' | 'search'>('nearby');

  useEffect(() => {
    loadNearbyUsers();
  }, []);

  /**
   * Load nearby users with shared interests
   */
  const loadNearbyUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get users with shared activities (show recently active users)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          display_name,
          avatar,
          bio,
          last_active,
          is_online
        `)
        .neq('id', user.id) // Exclude current user
        .gte('last_active', sevenDaysAgo.toISOString()) // Show users active in last 7 days
        .order('last_active', { ascending: false }) // Most recently active first
        .limit(20);

      if (error) {
        console.error('Error loading nearby users:', error);
        return;
      }

      console.log(`✅ Found ${users?.length || 0} recently active users`);

      // Get friendship status for each user
      const usersWithStatus = await Promise.all(
        (users || []).map(async (otherUser) => {
          const friendshipStatus = await getFriendshipStatus(otherUser.id);
          const sharedActivities = await getSharedActivitiesCount(otherUser.id);
          
          return {
            ...otherUser,
            friendship_status: friendshipStatus,
            shared_activities: sharedActivities,
          };
        })
      );

      console.log(`👥 Processed ${usersWithStatus.length} users with friendship status`);
      setNearbyUsers(usersWithStatus);
    } catch (error) {
      console.error('Error loading nearby users:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search for users by username or display name
   */
  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          display_name,
          avatar,
          bio
        `)
        .neq('id', user.id)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(15);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      console.log(`🔍 Search for "${query}" found ${users?.length || 0} users`);

      // Get friendship status for each user
      const usersWithStatus = await Promise.all(
        (users || []).map(async (otherUser) => {
          const friendshipStatus = await getFriendshipStatus(otherUser.id);
          const sharedActivities = await getSharedActivitiesCount(otherUser.id);
          
          return {
            ...otherUser,
            friendship_status: friendshipStatus,
            shared_activities: sharedActivities,
          };
        })
      );

      console.log(`🔍 Search results processed: ${usersWithStatus.length} users`);
      setSearchResults(usersWithStatus);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get friendship status with another user
   */
  const getFriendshipStatus = async (otherUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted'> => {
    if (!user) return 'none';

    try {
      const { data: friendship, error } = await supabase
        .from('friendships')
        .select('*')
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`
        )
        .single();

      if (error || !friendship) {
        return 'none';
      }

      if (friendship.status === 'accepted') {
        return 'accepted';
      } else if (friendship.requester_id === user.id) {
        return 'pending_sent';
      } else {
        return 'pending_received';
      }
    } catch (error) {
      return 'none';
    }
  };

  /**
   * Get count of shared activities with another user
   */
  const getSharedActivitiesCount = async (otherUserId: string): Promise<number> => {
    if (!user) return 0;

    try {
      // Get current user's activities
      const { data: myActivities, error: myError } = await supabase
        .from('user_activities')
        .select('activity_id')
        .eq('user_id', user.id);

      if (myError || !myActivities) return 0;

      // Get other user's activities
      const { data: theirActivities, error: theirError } = await supabase
        .from('user_activities')
        .select('activity_id')
        .eq('user_id', otherUserId);

      if (theirError || !theirActivities) return 0;

      // Count shared activities
      const myActivityIds = myActivities.map(a => a.activity_id);
      const sharedCount = theirActivities.filter(a => 
        myActivityIds.includes(a.activity_id)
      ).length;

      return sharedCount;
    } catch (error) {
      return 0;
    }
  };

  /**
   * Send friend request
   */
  const sendFriendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;

    try {
      // Optimistically update UI immediately
      const updateUserStatus = (users: UserResult[]) => {
        return users.map(u => 
          u.id === targetUserId 
            ? { ...u, friendship_status: 'pending_sent' as const }
            : u
        );
      };

      // Update local state immediately for better UX
      if (searchMode === 'nearby') {
        setNearbyUsers(prev => updateUserStatus(prev));
      } else {
        setSearchResults(prev => updateUserStatus(prev));
      }

      // Update database
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      Alert.alert('Success', `Friend request sent to ${targetUsername}! 📨`);
      
      // Refresh the data after a short delay to ensure database consistency
      setTimeout(() => {
        if (searchMode === 'nearby') {
          loadNearbyUsers();
        } else {
          searchUsers(searchQuery);
        }
      }, 1000);

    } catch (error) {
      console.error('Error sending friend request:', error);
      
      // Revert optimistic update on error
      if (searchMode === 'nearby') {
        loadNearbyUsers();
      } else {
        searchUsers(searchQuery);
      }
      
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

  /**
   * Accept friend request
   */
  const acceptFriendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;

    try {
      // Optimistically update UI immediately for better UX
      const updateUserStatus = (users: UserResult[]) => {
        return users.map(u => 
          u.id === targetUserId 
            ? { ...u, friendship_status: 'accepted' as const }
            : u
        );
      };

      // Update local state immediately for better UX
      if (searchMode === 'nearby') {
        setNearbyUsers(prev => updateUserStatus(prev));
      } else {
        setSearchResults(prev => updateUserStatus(prev));
      }

      // Update database
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', targetUserId)
        .eq('addressee_id', user.id);

      if (error) {
        throw error;
      }

      // Show celebratory tribe-mate confirmation
      Alert.alert(
        '🎉 Welcome to the Tribe!', 
        `You and ${targetUsername} are now tribe-mates! You can discover activities together, share moments, and explore new interests. Start your journey of mutual discovery! 🚀`,
        [
          { text: 'Discover Together!', style: 'default' }
        ]
      );
      
      // Refresh the data after a short delay to ensure database consistency
      setTimeout(() => {
        if (searchMode === 'nearby') {
          loadNearbyUsers();
        } else {
          searchUsers(searchQuery);
        }
      }, 1000);

    } catch (error) {
      console.error('Error accepting friend request:', error);
      
      // Revert optimistic update on error
      if (searchMode === 'nearby') {
        loadNearbyUsers();
      } else {
        searchUsers(searchQuery);
      }
      
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      setSearchMode('search');
      searchUsers(text);
    } else {
      setSearchMode('nearby');
      setSearchResults([]);
    }
  };

  /**
   * Refresh current data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    if (searchMode === 'nearby') {
      await loadNearbyUsers();
    } else {
      await searchUsers(searchQuery);
    }
    setRefreshing(false);
  };

  /**
   * Render user item
   */
  const renderUserItem = ({ item }: { item: UserResult }) => {
    const getActionButton = () => {
      switch (item.friendship_status) {
        case 'accepted':
          return (
            <View style={styles.tribeMateButton}>
              <Ionicons name="people" size={16} color="#8B5CF6" />
              <Text style={styles.tribeMateButtonText}>Tribe-mate</Text>
            </View>
          );
        case 'pending_sent':
          return (
            <View style={styles.pendingButton}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.pendingButtonText}>Pending</Text>
            </View>
          );
        case 'pending_received':
          return (
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => acceptFriendRequest(item.id, item.username)}
            >
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          );
        default:
          return (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => sendFriendRequest(item.id, item.username)}
            >
              <Ionicons name="person-add-outline" size={16} color="#3B82F6" />
              <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
          );
      }
    };

    return (
      <View style={styles.userItem}>
        <View style={styles.userAvatar}>
          {item.avatar.startsWith('http') ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarEmoji}>{item.avatar}</Text>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userDisplayName}>{item.display_name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
          )}
          <View style={styles.userStats}>
            <Text style={styles.sharedActivities}>
              🎯 {item.shared_activities} shared interests
            </Text>
          </View>
        </View>

        <View style={styles.userActions}>
          {getActionButton()}
        </View>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={searchMode === 'search' ? 'search' : 'people'} 
        size={60} 
        color="#9CA3AF" 
      />
      <Text style={styles.emptyTitle}>
        {searchMode === 'search' ? 'No users found' : 'No recent tribe members'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchMode === 'search' 
          ? 'Try searching for a different username or name'
          : 'No users have been active in the last 7 days. Try using the search to find specific users.'
        }
      </Text>
    </View>
  );

  const currentData = searchMode === 'search' ? searchResults : nearbyUsers;

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6', '#a855f7']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Your Tribe</Text>
          <Text style={styles.headerSubtitle}>
            Connect with like-minded people
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or name..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mode Indicator */}
        <View style={styles.modeContainer}>
          <Text style={styles.modeText}>
            {searchMode === 'search' 
              ? `Search results for "${searchQuery}"`
              : 'Recently active users (last 7 days)'
            }
          </Text>
        </View>

        {/* User List */}
        <FlatList
          data={currentData}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          contentContainerStyle={styles.userListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>
                  {searchMode === 'search' ? 'Searching...' : 'Loading nearby users...'}
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F0F0F0',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#1F2937',
  },
  clearButton: {
    padding: 5,
  },
  modeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  modeText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    paddingHorizontal: 20,
  },
  userItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userDisplayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 6,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedActivities: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  userActions: {
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  addButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pendingButtonText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  friendButtonText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  tribeMateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  tribeMateButtonText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingFooter: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
  },
});

export default UserSearchScreen; 