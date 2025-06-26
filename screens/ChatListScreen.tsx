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

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search for users when search query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

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
          {loading ? (
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
              ListEmptyComponent={searchQuery.length > 0 ? renderEmptyState : null}
            />
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
});

export default ChatListScreen; 