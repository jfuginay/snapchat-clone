import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  is_online: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  other_user?: User;
}

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);

  // Load existing chat rooms on mount
  useEffect(() => {
    loadChatRooms();
  }, []);

  // Search for users when search query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const loadChatRooms = async () => {
    if (!user) return;

    try {
      setLoadingChats(true);
      
      // Get chat rooms where user is a participant
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          participants,
          created_at,
          updated_at
        `)
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading chat rooms:', error);
        return;
      }

      // For each chat room, get the other user info and last message
      const roomsWithDetails = await Promise.all(
        (rooms || []).map(async (room) => {
          // Get other user info for direct chats
          let otherUser: User | undefined;
          if (room.type === 'direct') {
            const otherUserId = room.participants.find((id: string) => id !== user.id);
            if (otherUserId) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, username, display_name, avatar, is_online')
                .eq('id', otherUserId)
                .single();
              otherUser = userData || undefined;
            }
          }

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('chat_room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            other_user: otherUser,
            last_message: lastMessageData || undefined,
          };
        })
      );

      setChatRooms(roomsWithDetails);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const searchUsers = async () => {
    if (!user || !searchQuery.trim()) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar, is_online')
        .neq('id', user.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (otherUser: User) => {
    if (!user) return;

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('type', 'direct')
        .contains('participants', [user.id, otherUser.id])
        .single();

      let chatRoomId: string;

      if (existingChat) {
        chatRoomId = existingChat.id;
      } else {
        // Create new chat room
        const { data: newChat, error } = await supabase
          .from('chat_rooms')
          .insert({
            name: `${user.username}-${otherUser.username}`,
            type: 'direct',
            participants: [user.id, otherUser.id],
            created_by: user.id,
          })
          .select('id')
          .single();

        if (error) {
          Alert.alert('Error', 'Failed to create chat');
          return;
        }

        chatRoomId = newChat.id;
      }

      // Refresh chat list to show the new chat
      loadChatRooms();

      // Navigate to chat screen
      (navigation as any).navigate('ChatScreen', {
        chatRoomId,
        otherUser,
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const otherUser = item.other_user;
    const isImageUrl = otherUser?.avatar && otherUser.avatar.startsWith('http');
    const displayName = otherUser?.display_name || item.name;
    const lastMessage = item.last_message;
    const isMyMessage = lastMessage?.sender_id === user?.id;

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    };

    return (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => {
          (navigation as any).navigate('ChatScreen', {
            chatRoomId: item.id,
            otherUser: otherUser,
          });
        }}
      >
        <View style={styles.avatarContainer}>
          {isImageUrl ? (
            <Image
              source={{ uri: otherUser.avatar }}
              style={styles.avatarImage}
              defaultSource={require('../assets/icon.png')}
            />
          ) : (
            <Text style={styles.avatarEmoji}>{otherUser?.avatar || '👤'}</Text>
          )}
          {otherUser?.is_online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatDisplayName}>{displayName}</Text>
            {lastMessage && (
              <Text style={styles.chatTime}>{formatTime(lastMessage.created_at)}</Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage 
              ? `${isMyMessage ? 'You: ' : ''}${lastMessage.content}`
              : 'No messages yet'
            }
          </Text>
        </View>

        <View style={styles.chatArrow}>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isImageUrl = item.avatar && item.avatar.startsWith('http');

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => startChat(item)}
      >
        <View style={styles.avatarContainer}>
          {isImageUrl ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatarImage}
              defaultSource={require('../assets/icon.png')}
            />
          ) : (
            <Text style={styles.avatarEmoji}>{item.avatar || '👤'}</Text>
          )}
          {item.is_online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.display_name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>

        <View style={styles.chatButton}>
          <Ionicons name="chatbubble" size={20} color="#8B5CF6" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={60} color="#E0E7FF" />
      <Text style={styles.emptyTitle}>Find Tribe Members</Text>
      <Text style={styles.emptySubtitle}>
        Search by username or name to start chatting
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6', '#a855f7']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tribe Chat</Text>
          <Text style={styles.headerSubtitle}>Connect with your tribe</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tribe members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {searchQuery.length > 0 ? (
            // Show search results when searching
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
              />
            )
          ) : (
            // Show existing chat rooms when not searching
            loadingChats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading chats...</Text>
              </View>
            ) : (
              <FlatList
                data={chatRooms}
                renderItem={renderChatRoom}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={60} color="#E0E7FF" />
                    <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Search for tribe members above to start chatting
                    </Text>
                  </View>
                )}
              />
            )
          )}
        </View>
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
    paddingTop: 10,
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
    marginBottom: 20,
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
  resultsContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarEmoji: {
    fontSize: 40,
    textAlign: 'center',
    width: 50,
    height: 50,
    lineHeight: 50,
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
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  chatButton: {
    padding: 8,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
  },
  // Chat room styles
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#C4B5FD',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#E0E7FF',
    opacity: 0.8,
  },
  chatArrow: {
    padding: 4,
  },
});

export default ChatListScreen; 