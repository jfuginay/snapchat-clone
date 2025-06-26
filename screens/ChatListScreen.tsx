import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender?: {
      username: string;
      display_name: string;
      avatar: string;
    };
  };
  unread_count?: number;
  other_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
    is_online: boolean;
    last_active: string;
    distance?: number;
  };
}

interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  bio: string;
  is_online: boolean;
  last_active: string;
  distance?: number;
  friendship_status: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'chats' | 'users'>('chats');

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadChatRooms();
      }
    }, [user])
  );

  /**
   * Load existing chat rooms
   */
  const loadChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load chat rooms with last message
      const { data: chatRoomsData, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          messages!chat_rooms_id_fkey (
            id,
            content,
            sender_id,
            created_at,
            sender:users!messages_sender_id_fkey (
              username,
              display_name,
              avatar
            )
          )
        `)
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading chat rooms:', error);
        Alert.alert('Error', 'Failed to load conversations.');
        return;
      }

      // Process chat rooms with last message and other user info
      const processedChatRooms = await Promise.all(
        (chatRoomsData || []).map(async (room) => {
          // Get last message
          const messages = Array.isArray(room.messages) ? room.messages : [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

          // For direct chats, get other user info
          let otherUser = null;
          if (room.type === 'direct') {
            const otherUserId = room.participants.find((id: string) => id !== user.id);
            if (otherUserId) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, username, display_name, avatar, is_online, last_active')
                .eq('id', otherUserId)
                .single();
              
              otherUser = userData;
            }
          }

          return {
            ...room,
            last_message: lastMessage,
            other_user: otherUser,
            unread_count: 0, // TODO: Implement unread count
          };
        })
      );

      setChatRooms(processedChatRooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search for users (nearby + friends)
   */
  const searchUsers = async (query: string) => {
    if (!user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);

      // Search for users by username or display name
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar, bio, is_online, last_active')
        .neq('id', user.id)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      // Get friendship status for each user
      const usersWithStatus = await Promise.all(
        (users || []).map(async (otherUser) => {
          const friendshipStatus = await getFriendshipStatus(otherUser.id);
          
          return {
            ...otherUser,
            friendship_status: friendshipStatus,
            distance: Math.floor(Math.random() * 10000), // TODO: Calculate actual distance
          };
        })
      );

      // Filter to show only friends or nearby users (within 10km)
      const filteredUsers = usersWithStatus.filter(user => 
        user.friendship_status === 'accepted' || 
        user.friendship_status === 'pending_sent' ||
        user.friendship_status === 'pending_received' ||
        (user.distance && user.distance <= 10000)
      );

      setSearchResults(filteredUsers);
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
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`)
        .single();

      if (error || !friendship) return 'none';

      if (friendship.status === 'accepted') return 'accepted';
      if (friendship.requester_id === user.id) return 'pending_sent';
      return 'pending_received';
    } catch (error) {
      return 'none';
    }
  };

  /**
   * Start chat with user
   */
  const startChat = async (targetUser: SearchUser) => {
    if (!user) return;

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('type', 'direct')
        .contains('participants', [user.id, targetUser.id])
        .single();

      if (existingChat) {
        // Navigate to existing chat
        (navigation as any).navigate('ChatScreen', {
          chatRoomId: existingChat.id,
          otherUser: targetUser,
        });
        return;
      }

      // Create new chat room
      const { data: newChat, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: `${user.username}-${targetUser.username}`,
          type: 'direct',
          participants: [user.id, targetUser.id],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to create chat.');
        return;
      }

      // Navigate to new chat
      (navigation as any).navigate('ChatScreen', {
        chatRoomId: newChat.id,
        otherUser: targetUser,
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat.');
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      setSearchMode('users');
      searchUsers(text);
    } else {
      setSearchMode('chats');
      setSearchResults([]);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    if (searchMode === 'chats') {
      await loadChatRooms();
    } else {
      await searchUsers(searchQuery);
    }
    setRefreshing(false);
  };

  /**
   * Get time display for messages
   */
  const getTimeDisplay = (timestamp: string): string => {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageTime.toLocaleDateString();
  };

  /**
   * Render chat room item
   */
  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const displayName = item.type === 'direct' 
      ? item.other_user?.display_name || 'Unknown User'
      : item.name;
    
    const avatar = item.type === 'direct' 
      ? item.other_user?.avatar || '👤'
      : '👥';

    const lastMessage = item.last_message?.content || 'No messages yet';
    const isOnline = item.type === 'direct' ? item.other_user?.is_online : false;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          (navigation as any).navigate('ChatScreen', {
            chatRoomId: item.id,
            otherUser: item.other_user,
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{avatar}</Text>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{displayName}</Text>
            {item.last_message && (
              <Text style={styles.messageTime}>
                {getTimeDisplay(item.last_message.created_at)}
              </Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>

        {item.unread_count && item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render search user item
   */
  const renderSearchUser = ({ item }: { item: SearchUser }) => {
    const canChat = item.friendship_status === 'accepted' || 
                   item.friendship_status === 'pending_sent' ||
                   item.friendship_status === 'pending_received' ||
                   (item.distance && item.distance <= 10000);

    const getStatusIcon = () => {
      switch (item.friendship_status) {
        case 'accepted': return 'people';
        case 'pending_sent': return 'time';
        case 'pending_received': return 'person-add';
        default: return 'location';
      }
    };

    const getStatusText = () => {
      switch (item.friendship_status) {
        case 'accepted': return 'Tribe Member';
        case 'pending_sent': return 'Request Sent';
        case 'pending_received': return 'Friend Request';
        default: return item.distance ? `${(item.distance / 1000).toFixed(1)}km away` : 'Nearby';
      }
    };

    return (
      <TouchableOpacity
        style={[styles.searchItem, !canChat && styles.searchItemDisabled]}
        onPress={() => canChat && startChat(item)}
        disabled={!canChat}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          {item.is_online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.display_name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
          )}
        </View>

        <View style={styles.statusContainer}>
          <Ionicons name={getStatusIcon()} size={16} color="#8B5CF6" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={searchMode === 'chats' ? 'chatbubbles-outline' : 'search'} 
        size={60} 
        color="#E0E7FF" 
      />
      <Text style={styles.emptyTitle}>
        {searchMode === 'chats' ? 'No conversations yet' : 'Search for tribe members'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchMode === 'chats' 
          ? 'Start a conversation with nearby users or tribe members'
          : 'Search by username or name to find people to chat with'
        }
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6', '#a855f7']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tribe Chat</Text>
          <Text style={styles.headerSubtitle}>
            Connect with nearby members and friends
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for tribe members..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              returnKeyType="search"
              placeholderTextColor="#9CA3AF"
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
            {searchMode === 'chats' 
              ? 'Your Conversations'
              : `Search results for "${searchQuery}"`
            }
          </Text>
        </View>

        {/* List */}
        {searchMode === 'chats' ? (
          <FlatList
            data={chatRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor="#FFFFFF"
              />
            }
            ListEmptyComponent={!loading ? renderEmptyState : null}
            ListFooterComponent={
              loading ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchUser}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor="#FFFFFF"
              />
            }
            ListEmptyComponent={!loading ? renderEmptyState : null}
            ListFooterComponent={
              loading ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : null
            }
          />
        )}
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
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  clearButton: {
    padding: 5,
  },
  modeContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modeText: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  searchItemDisabled: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    fontSize: 40,
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    color: '#E0E7FF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: 2,
  },
  userBio: {
    fontSize: 12,
    color: '#E0E7FF',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
  },
});

export default ChatListScreen; 